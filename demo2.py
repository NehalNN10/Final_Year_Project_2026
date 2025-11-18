# ! /usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import division, print_function, absolute_import

import os
# import tensorflow as tf
# import keras.backend.tensorflow_backend as KTF

from timeit import time
import warnings
import argparse

import sys
import cv2
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

import base64
import requests
import urllib
from urllib import parse
import json
import random
import time
from PIL import Image
from collections import Counter
import operator

# from yolo_v3 import YOLO3
# from yolo_v4 import YOLO4
# from deep_sort import preprocessing
# from deep_sort import nn_matching
# from deep_sort.detection import Detection
# from deep_sort.tracker import Tracker
# from tools import generate_detections as gdet
# from deep_sort.detection import Detection as ddet

from reid import REID
import copy

def build_args():
  parser = argparse.ArgumentParser()
  parser.add_argument("--model", required=False, default="yolov8n.pt", help="YOLOv8 model (pt file or model name)")

  parser.add_argument('--videos', nargs='+', help='List of videos', required=True)
  parser.add_argument('-all', help='Combine all videos into one', default=True)
  args = parser.parse_args()  # vars(parser.parse_args())
  return args


class LoadVideo:  # for inference
    def __init__(self, path):
        if not os.path.isfile(path):
            raise FileExistsError

        self.cap = cv2.VideoCapture(path)
        self.frame_rate = int(round(self.cap.get(cv2.CAP_PROP_FPS)))
        self.vw = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.vh = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.vn = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # self.width = img_size[0]
        # self.height = img_size[1]
        self.count = 0

        print('Length of {}: {:d} frames'.format(path, self.vn))

    def get_VideoLabels(self):
        return self.cap, self.frame_rate, self.vw, self.vh


def main():
    args = build_args()
    
    model = YOLO(args.model)

    print("hey1")
    model.to('cpu')

    print("hey2")
    tracker = DeepSort(max_age = 300, n_init = 3, nn_budget=100,max_iou_distance=0.7) 


    output_frames = []
    output_rectanger = []
    output_areas = []
    output_wh_ratio = []

    is_vis = True
    out_dir = './output/'
    print('The output folder is', out_dir)
    if not os.path.exists(out_dir):
        os.mkdir(out_dir)

    
    # Initialize tracking file
    filename = os.path.join(out_dir, 'tracking.txt')
    open(filename, 'w').close()

    fps = 0.0
    frame_cnt = 0
    t1 = time.time()

    track_cnt = {}
    images_by_id = {}
    ids_per_frame = []
    frame_rate, w, h = None, None, None

    # Create output video writers after first video setup
    tracking_path = os.path.join(out_dir, 'tracking.avi')
    combined_path = os.path.join(out_dir, 'allVideos.avi')
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    out = None
    out2 = None
    print(f"video args{args.videos}")
    for video in args.videos:
        print(f"Video path: {video}")
        loadvideo = LoadVideo(video)
        video_capture, frame_rate, w, h = loadvideo.get_VideoLabels()
        if out is None and is_vis:
            out = cv2.VideoWriter(tracking_path, fourcc, frame_rate, (w, h))
            out2 = cv2.VideoWriter(combined_path, fourcc, frame_rate, (w, h))
        while True:
            ret, frame = video_capture.read()
            if not ret:
                video_capture.release()
                break

            # Write directly instead of saving to all_frames
            if is_vis:
              
              out2.write(frame)
            results = model.predict(frame, conf=0.4, iou=0.5, verbose=True)
            r = results[0]
            detections_for_tracker = []
            if hasattr(r,'boxes') and len(r.boxes) > 0:
              for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                if cls == 0:
                  detections_for_tracker.append(([x1,y1,x2,y2],conf,"person"))
            
            print(f"frame num: {frame_cnt}, detections: {detections_for_tracker}")
            tracks = tracker.update_tracks(detections_for_tracker, frame=frame)
            tmp_ids = []
            for track in tracks:
              if not track.is_confirmed():
                continue
              bbox = track.to_ltrb()
              x1, y1, x2, y2 = map(int,bbox)
              area = (x2 -x1) * (y2 - y1)
              if x1 >= 0 and y1 >= 0 and y2 < h and x2 < w:
                tmp_ids.append(track.track_id)

                if track.track_id not in track_cnt:
                  track_cnt[track.track_id] = [
                    [frame_cnt, x1, y1, x2, y2, area]
                  ]
                  images_by_id[track.track_id] = [frame[y1:y2,x1:x2]]
                else:
                  track_cnt[track.track_id].append([frame_cnt, x1, y1, x2, y2, area])
                  images_by_id[track.track_id].append(frame[y1:y2, x1:x2])
                
                text_scale, text_thickness, line_thickness = get_FrameLabels(frame)
                cv2_addBox(
                track.track_id,
                frame,
                x1, y1, x2, y2,
                line_thickness,
                text_thickness,
                text_scale
                )
                write_results(
                    filename,
                    'mot',
                    frame_cnt + 1,
                    str(track.track_id),
                    x1, y1, x2, y2,
                    w, h
                )

            ids_per_frame.append(set(tmp_ids))
            if is_vis:
              
              out.write(frame)
            t2 = time.time()
            frame_cnt += 1
            

        video_capture.release()
        print("1st video done")
    if is_vis:
        out.release()
        out2.release()
    print('Tracking finished in {} seconds'.format(int(time.time() - t1)))
    print('Tracked video : {}'.format(tracking_path))
    print('Combined video : {}'.format(combined_path))
        
    # os.environ["CUDA_VISIBLE_DEVICES"] = "0,1,2,3"
    reid = REID()
    threshold = 320 #how similar 2 ppl features must be to be considered the same person
    exist_ids = set() #track of all ids we have alr seen
    final_fuse_id = dict() # dict mapping final global ids to list of sub ids  1: [1,5,9] these all r same person
    """This code does cross-ID fusion after initial per-camera DeepSORT tracking:

    Each track ID has its images (from DeepSORT).

    The ReID model extracts appearance features for each ID.

    If two IDs look similar (distance < threshold), they’re merged.

    This way, the same person gets the same global ID even across cameras."""




    print(f'Total IDs = {len(images_by_id)}')
    feats = dict()
    for i in images_by_id:
        print(f'ID number {i} -> Number of frames {len(images_by_id[i])}')
        feats[i] = reid._features(images_by_id[i])  # reid._features(images_by_id[i][:min(len(images_by_id[i]),100)])

    for f in ids_per_frame:
        if f:
            if len(exist_ids) == 0:
                for i in f:
                    final_fuse_id[i] = [i]
                exist_ids = exist_ids or f
            else:
                new_ids = f - exist_ids
                for nid in new_ids:
                    dis = []
                    if len(images_by_id[nid]) < 10:
                        exist_ids.add(nid)
                        continue
                    unpickable = []
                    for i in f:
                        for key, item in final_fuse_id.items():
                            if i in item:
                                unpickable += final_fuse_id[key]
                    print('exist_ids {} unpickable {}'.format(exist_ids, unpickable))
                    for oid in (exist_ids - set(unpickable)) & set(final_fuse_id.keys()):
                        tmp = np.mean(reid.compute_distance(feats[nid], feats[oid]))
                        print('nid {}, oid {}, tmp {}'.format(nid, oid, tmp))
                        dis.append([oid, tmp])
                    exist_ids.add(nid)
                    if not dis:
                        final_fuse_id[nid] = [nid]
                        continue
                    dis.sort(key=operator.itemgetter(1))
                    if dis[0][1] < threshold:
                        combined_id = dis[0][0]
                        images_by_id[combined_id] += images_by_id[nid]
                        final_fuse_id[combined_id].append(nid)
                    else:
                        final_fuse_id[nid] = [nid]
    print('Final ids and their sub-ids:', final_fuse_id)
    print('MOT took {} seconds'.format(int(time.time() - t1)))
    t2 = time.time()

    # To generate MOT for each person, declare 'is_vis' to True
    is_vis = False
    if is_vis:
        print('Writing videos for each ID...')
        output_dir = 'videos/output/tracklets/'
        if not os.path.exists(output_dir):
            os.mkdir(output_dir)
        loadvideo = LoadVideo(combined_path)
        video_capture, frame_rate, w, h = loadvideo.get_VideoLabels()
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        for idx in final_fuse_id:
            tracking_path = os.path.join(output_dir, str(idx)+'.avi')
            out = cv2.VideoWriter(tracking_path, fourcc, frame_rate, (w, h))
            for i in final_fuse_id[idx]:
                for f in track_cnt[i]:
                    video_capture.set(cv2.CAP_PROP_POS_FRAMES, f[0])
                    _, frame = video_capture.read()
                    text_scale, text_thickness, line_thickness = get_FrameLabels(frame)
                    cv2_addBox(idx, frame, f[1], f[2], f[3], f[4], line_thickness, text_thickness, text_scale)
                    out.write(frame)
            out.release()
        video_capture.release()

    # Generate a single video with complete MOT/ReID
    if args.all:
        loadvideo = LoadVideo(combined_path)
        video_capture, frame_rate, w, h = loadvideo.get_VideoLabels()
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        complete_path = out_dir+'/Complete'+'.avi'
        out = cv2.VideoWriter(complete_path, fourcc, frame_rate, (w, h))
        total_frames = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Total frames: {total_frames}")

        for frame_idx in range(total_frames):
            ret, frame = video_capture.read()
            if not ret:
              break

            # frame2 = all_frames[frame]
            # video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame)
            # _, frame2 = video_capture.read()
            for idx in final_fuse_id:
                for i in final_fuse_id[idx]:
                    for f in track_cnt[i]:
                        # print('frame {} f0 {}'.format(frame,f[0]))
                        if frame_idx == f[0]:
                            text_scale, text_thickness, line_thickness = get_FrameLabels(frame)
                            cv2_addBox(idx, frame, f[1], f[2], f[3], f[4], line_thickness, text_thickness, text_scale)
            out.write(frame)
        out.release()
        video_capture.release()

    os.remove(combined_path)
    print('\nWriting videos took {} seconds'.format(int(time.time() - t2)))
    print('Final video at {}'.format(complete_path))
    print('Total: {} seconds'.format(int(time.time() - t1)))


def get_FrameLabels(frame):
    text_scale = max(1, frame.shape[1] / 1600.)
    text_thickness = 1 if text_scale > 1.1 else 1
    line_thickness = max(1, int(frame.shape[1] / 500.))
    return text_scale, text_thickness, line_thickness


def cv2_addBox(track_id, frame, x1, y1, x2, y2, line_thickness, text_thickness, text_scale):
    color = get_color(abs(int(track_id)))
    cv2.rectangle(frame, (x1, y1), (x2, y2), color=color, thickness=line_thickness)
    cv2.putText(
        frame, str(track_id), (x1, y1 + 30), cv2.FONT_HERSHEY_PLAIN, text_scale, (0, 0, 255), thickness=text_thickness)


def write_results(filename, data_type, w_frame_id, w_track_id, w_x1, w_y1, w_x2, w_y2, w_wid, w_hgt):
    if data_type == 'mot':
        save_format = '{frame},{id},{x1},{y1},{x2},{y2},{w},{h}\n'
    else:
        raise ValueError(data_type)
    with open(filename, 'a') as f:
        line = save_format.format(frame=w_frame_id, id=w_track_id, x1=w_x1, y1=w_y1, x2=w_x2, y2=w_y2, w=w_wid, h=w_hgt)
        f.write(line)
    # print('save results to {}'.format(filename))


warnings.filterwarnings('ignore')


def get_color(idx):
    idx = idx * 3
    color = ((37 * idx) % 255, (17 * idx) % 255, (29 * idx) % 255)
    return color


if __name__ == "__main__":
   main()