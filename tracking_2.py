#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CPU-friendly multi-video people detection + short-term tracking + cross-camera ReID
Uses:
 - YOLOv8 (ultralytics) for person detection (class 0)
 - simple centroid + IoU tracker with appearance (ResNet50) embeddings
 - cross-video ReID by comparing average track embeddings (cosine similarity)

Notes:
 - Written for CPU-only execution (torch on CPU)
 - Works best when person crops are reasonably sized
 - Thresholds (iou, cosine) tuned conservatively; adjust if needed
"""

from __future__ import division, print_function, absolute_import

import argparse
import os
import sys
import time
from collections import deque, defaultdict

import cv2
import numpy as np
import torch
import torchvision.transforms as T
import torchvision.models as models
from sklearn.metrics.pairwise import cosine_distances
from ultralytics import YOLO
from PIL import Image

# -----------------------
# CLI args
# -----------------------
parser = argparse.ArgumentParser()
parser.add_argument('--videos', nargs='+', help='List of videos', required=True)
parser.add_argument('--outdir', default='videos/output', help='Output directory')
parser.add_argument('--model', default='yolov8n.pt', help='YOLOv8 model (path or name)')
parser.add_argument('--iou_thresh', type=float, default=0.3, help='IOU threshold for matching detections to tracks')
parser.add_argument('--conf_thresh', type=float, default=0.35, help='YOLO confidence threshold')
parser.add_argument('--reid_cosine_thresh', type=float, default=0.45, help='Cosine-distance threshold for cross-video ReID (lower = more similar)')
parser.add_argument('--max_disappeared', type=int, default=30, help='Frames to tolerate disappearance before deleting track')
parser.add_argument('--min_frames_for_reid', type=int, default=10, help='Min frames per track to compute reliable ReID embedding')
args = parser.parse_args()

# -----------------------
# Utility functions
# -----------------------
def iou(boxA, boxB):
    # boxes: [x1,y1,x2,y2]
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    interArea = interW * interH
    if interArea == 0:
        return 0.0
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    return interArea / float(boxAArea + boxBArea - interArea)

def xywh_to_xyxy(xywh):
    x, y, w, h = xywh
    return [int(x), int(y), int(x + w), int(y + h)]

def clamp_box(box, w, h):
    x1 = max(0, min(box[0], w - 1))
    y1 = max(0, min(box[1], h - 1))
    x2 = max(0, min(box[2], w - 1))
    y2 = max(0, min(box[3], h - 1))
    return [int(x1), int(y1), int(x2), int(y2)]

# -----------------------
# Appearance embedding model (ResNet50, CPU)
# -----------------------
device = torch.device('cpu')  # enforce CPU
resnet = models.resnet50(pretrained=True)
# remove final classification layer -> feature vector of size 2048
resnet.fc = torch.nn.Identity()
resnet.eval().to(device)

transform = T.Compose([
    T.Resize((128, 64)),  # common ReID crop size (HxW)
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225])
])

def extract_embedding(crop_bgr):
    # crop_bgr: HxWx3 (np.uint8, BGR)
    if crop_bgr.size == 0:
        return None
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(crop_rgb)
    tensor = transform(pil).unsqueeze(0).to(device)
    with torch.no_grad():
        feat = resnet(tensor).cpu().numpy().squeeze()
    # L2 normalize
    norm = np.linalg.norm(feat)
    if norm == 0:
        return feat
    return feat / norm

# -----------------------
# Simple tracker: centroid+IoU + appearance
# -----------------------
class Track:
    def __init__(self, track_id, box, frame_idx, embed=None):
        # box: [x1,y1,x2,y2]
        self.id = track_id
        self.bbox = box
        self.last_frame = frame_idx
        self.disappeared = 0
        self.hits = 1
        self.box_history = [box]
        self.frame_history = [frame_idx]
        self.embeddings = []
        if embed is not None:
            self.embeddings.append(embed)

    def update(self, box, frame_idx, embed=None):
        self.bbox = box
        self.last_frame = frame_idx
        self.disappeared = 0
        self.hits += 1
        self.box_history.append(box)
        self.frame_history.append(frame_idx)
        if embed is not None:
            self.embeddings.append(embed)

    def mark_missed(self):
        self.disappeared += 1

    def average_embedding(self):
        if not self.embeddings:
            return None
        return np.mean(np.stack(self.embeddings, axis=0), axis=0)

class SimpleTracker:
    def __init__(self, iou_threshold=0.3, max_disappeared=30):
        self.iou_threshold = iou_threshold
        self.max_disappeared = max_disappeared
        self.next_id = 1
        self.tracks = dict()  # id -> Track

    def update(self, detections, frame_idx, frame_img):
        """
        detections: list of boxes [x1,y1,x2,y2] (ints)
        frame_img: full frame BGR (used to crop for embeddings)
        """
        assigned = dict()  # det_idx -> track_id

        if len(self.tracks) == 0:
            # create new tracks for all detections
            for i, box in enumerate(detections):
                crop = frame_img[box[1]:box[3], box[0]:box[2]]
                emb = extract_embedding(crop)
                tr = Track(self.next_id, box, frame_idx, emb)
                self.tracks[self.next_id] = tr
                assigned[i] = self.next_id
                self.next_id += 1
            return assigned

        # compute IoU between every detection and track bbox
        tr_ids = list(self.tracks.keys())
        tr_boxes = [self.tracks[t].bbox for t in tr_ids]
        iou_matrix = np.zeros((len(tr_boxes), len(detections)), dtype=np.float32)
        for i, tb in enumerate(tr_boxes):
            for j, db in enumerate(detections):
                iou_matrix[i, j] = iou(tb, db)

        # Greedy matching: for each detection, find best track with IoU>=threshold
        # We'll use Hungarian-style greedy selection by sorting matches
        pairs = []
        for i in range(iou_matrix.shape[0]):
            for j in range(iou_matrix.shape[1]):
                if iou_matrix[i, j] >= self.iou_threshold:
                    pairs.append((i, j, iou_matrix[i, j]))
        pairs.sort(key=lambda x: x[2], reverse=True)  # best IoU first

        used_tr = set()
        used_det = set()
        for tr_i, det_j, score in pairs:
            if tr_i in used_tr or det_j in used_det:
                continue
            tr_id = tr_ids[tr_i]
            box = detections[det_j]
            crop = frame_img[box[1]:box[3], box[0]:box[2]]
            emb = extract_embedding(crop)
            self.tracks[tr_id].update(box, frame_idx, emb)
            assigned[det_j] = tr_id
            used_tr.add(tr_i)
            used_det.add(det_j)

        # unmatched detections -> new tracks
        for d_idx, box in enumerate(detections):
            if d_idx in used_det:
                continue
            crop = frame_img[box[1]:box[3], box[0]:box[2]]
            emb = extract_embedding(crop)
            tr = Track(self.next_id, box, frame_idx, emb)
            self.tracks[self.next_id] = tr
            assigned[d_idx] = self.next_id
            self.next_id += 1

        # unmatched tracks -> mark disappeared
        for idx, tr_id in enumerate(tr_ids):
            if idx not in used_tr:
                self.tracks[tr_id].mark_missed()

        # remove tracks that have disappeared too long
        to_delete = [tid for tid, tr in self.tracks.items() if tr.disappeared > self.max_disappeared]
        for tid in to_delete:
            del self.tracks[tid]

        return assigned

# -----------------------
# Main pipeline
# -----------------------
def process_videos(video_paths, outdir):
    os.makedirs(outdir, exist_ok=True)
    # create YOLOv8 model (cpu)
    print('Loading YOLOv8 model on CPU:', args.model)
    yolo = YOLO(args.model)
    yolo.model.to(device)  # ensure CPU

    # Per-video trackers and stored outputs
    per_video_tracks = []  # each element: tracker instance
    per_video_track_records = []  # list of {track_id -> Track} snapshots after processing
    per_video_frame_count = []
    per_video_fps = []
    per_video_dims = []

    # Process each video sequentially (we combine frames later when writing merged video)
    for vid_idx, vid_path in enumerate(video_paths):
        print(f'\nProcessing video {vid_idx+1}/{len(video_paths)}: {vid_path}')
        if not os.path.isfile(vid_path):
            print('File not found:', vid_path)
            continue
        cap = cv2.VideoCapture(vid_path)
        fps = int(round(cap.get(cv2.CAP_PROP_FPS))) or 25
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        per_video_fps.append(fps)
        per_video_dims.append((w, h))
        tracker = SimpleTracker(iou_threshold=args.iou_thresh, max_disappeared=args.max_disappeared)
        frame_idx = 0
        # Prepare writer for annotated video
        out_path = os.path.join(outdir, f'annotated_vid_{vid_idx+1}.avi')
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        out_writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # YOLOv8 inference
            # Using ultralytics model.predict/predictor API returns results list
            # We use model(frame) -> results
            results = yolo(frame, imgsz=max(w, h), conf=args.conf_thresh, device='cpu')
            # iterate detections for the frame
            # results[0].boxes.xyxy, .cls, .conf
            detections = []
            det_confs = []
            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue
                xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes, 'xyxy') else np.array([])
                cls = boxes.cls.cpu().numpy() if hasattr(boxes, 'cls') else np.array([])
                confs = boxes.conf.cpu().numpy() if hasattr(boxes, 'conf') else np.array([])
                for b, c, cf in zip(xyxy, cls, confs):
                    # select person class (COCO class 0)
                    # YOLOv8 uses COCO mapping where person class is 0
                    if int(c) != 0:
                        continue
                    x1, y1, x2, y2 = map(int, b.tolist())
                    x1, y1, x2, y2 = clamp_box([x1, y1, x2, y2], w, h)
                    if x2 - x1 <= 2 or y2 - y1 <= 2:
                        continue
                    detections.append([x1, y1, x2, y2])
                    det_confs.append(float(cf))

            # Update tracker with detections, get mapping det_idx -> track_id
            assigned = tracker.update(detections, frame_idx, frame)

            # Draw boxes with track ids
            for det_idx, track_id in assigned.items():
                box = detections[det_idx]
                x1, y1, x2, y2 = box
                color = (int((37 * track_id) % 255), int((17 * track_id) % 255), int((29 * track_id) % 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color=color, thickness=2)
                cv2.putText(frame, f'ID {track_id}', (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            out_writer.write(frame)
            frame_idx += 1
            if frame_idx % 100 == 0:
                print(f'  processed {frame_idx} frames...')

        cap.release()
        out_writer.release()
        print(f'Finished video {vid_idx+1}; frames: {frame_idx}, out: {out_path}')

        # store tracker snapshot
        per_video_tracks.append(tracker)
        per_video_track_records.append({tid: tr for tid, tr in tracker.tracks.items()})
        per_video_frame_count.append(frame_idx)

    # -----------------------
    # Cross-video ReID matching
    # -----------------------
    # Build a global mapping: local (video_idx, local_track_id) -> global_id
    print('\nPerforming cross-video ReID matching...')

    # Collect track embeddings for tracks that have enough frames (min_frames_for_reid)
    records = []
    for v_idx, track_dict in enumerate(per_video_track_records):
        for local_id, tr in track_dict.items():
            if len(tr.frame_history) < args.min_frames_for_reid:
                # still include but mark as low-confidence
                avg_emb = tr.average_embedding()
                if avg_emb is None:
                    continue
                records.append({
                    'video_idx': v_idx,
                    'local_id': local_id,
                    'embedding': avg_emb,
                    'frames': len(tr.frame_history),
                    'track_obj': tr
                })
            else:
                avg_emb = tr.average_embedding()
                if avg_emb is None:
                    continue
                records.append({
                    'video_idx': v_idx,
                    'local_id': local_id,
                    'embedding': avg_emb,
                    'frames': len(tr.frame_history),
                    'track_obj': tr
                })

    # If no records, exit
    if not records:
        print('No track embeddings found. Exiting.')
        return

    # Build distance matrix between all records
    embs = np.stack([r['embedding'] for r in records], axis=0)
    # cosine_distances returns values in [0,2]; smaller = more similar
    dist_mat = cosine_distances(embs, embs)

    # Greedy clustering: create global IDs by linking closest pairs below threshold
    n = len(records)
    assigned_global = [-1] * n
    next_global = 1
    for i in range(n):
        if assigned_global[i] != -1:
            continue
        # start new group
        assigned_global[i] = next_global
        # link any other record j with dist < thresh and not same video or even same video allowed
        for j in range(i+1, n):
            if assigned_global[j] != -1:
                continue
            if dist_mat[i, j] <= args.reid_cosine_thresh:
                assigned_global[j] = next_global
        next_global += 1

    # Build mapping
    global_map = dict()  # (video_idx, local_id) -> global_id
    for idx, r in enumerate(records):
        global_map[(r['video_idx'], r['local_id'])] = assigned_global[idx]

    print(f'Assigned {next_global-1} global IDs across videos.')

    # -----------------------
    # Write tracking.txt (MOT format) and final merged video (optional)
    # -----------------------
    tracking_txt = os.path.join(args.outdir, 'tracking.txt')
    with open(tracking_txt, 'w') as fout:
        fout.write('# frame,global_id,x1,y1,x2,y2,w,h,local_video,local_id\n')

    # We'll write per-video annotated outputs that include the global ID as well
    for v_idx, vid_path in enumerate(video_paths):
        cap = cv2.VideoCapture(vid_path)
        fps = int(round(cap.get(cv2.CAP_PROP_FPS))) or 25
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        out_path = os.path.join(outdir, f'final_annotated_vid_{v_idx+1}.avi')
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        out_writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

        frame_idx = 0
        # reconstruct per-frame assignments by walking track histories
        # Build a dict: frame -> list of (global_id, bbox)
        frame_assignments = defaultdict(list)
        track_dict = per_video_track_records[v_idx]
        for local_id, tr in track_dict.items():
            g_id = global_map.get((v_idx, local_id), None)
            for (fidx, box) in zip(tr.frame_history, tr.box_history):
                if g_id is None:
                    continue
                frame_assignments[fidx].append((g_id, box, local_id))

        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            assigns = frame_assignments.get(frame_idx, [])
            for g_id, box, local_id in assigns:
                x1, y1, x2, y2 = box
                color = (int((37 * g_id) % 255), int((17 * g_id) % 255), int((29 * g_id) % 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color=color, thickness=2)
                cv2.putText(frame, f'G{g_id}/L{local_id}', (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                # write to tracking.txt: frame numbers 1-indexed
                with open(tracking_txt, 'a') as fout:
                    w = x2 - x1
                    hgt = y2 - y1
                    fout.write(f'{frame_idx+1},{g_id},{x1},{y1},{x2},{y2},{w},{hgt},{v_idx},{local_id}\n')
            out_writer.write(frame)
            frame_idx += 1

        cap.release()
        out_writer.release()
        print(f'Wrote annotated video for input {v_idx+1} -> {out_path}')

    print('All done. Tracking file:', tracking_txt)


if __name__ == '__main__':
    t0 = time.time()
    process_videos(args.videos, args.outdir)
    print('Total time:', int(time.time() - t0), 'seconds')
