# !/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Multi-camera MOT + ReID pipeline using YOLOv8 + DeepSORT
CPU-only version (no TensorFlow/GPU)
"""

import os
import cv2
import time
import numpy as np
from ultralytics import YOLO  # YOLOv8 model
from deep_sort_realtime.deepsort_tracker import DeepSort  # Updated DeepSORT
from PIL import Image
# from sklearn.metrics.pairwise import cosine_similarity


# =============== Video Loader ===============
class LoadVideo:
    """Load a video and extract basic info"""
    def __init__(self, path):
        if not os.path.isfile(path):
            raise FileExistsError(f"File not found: {path}")

        self.cap = cv2.VideoCapture(path)
        self.frame_rate = int(self.cap.get(cv2.CAP_PROP_FPS))
        self.w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Loaded {path}: {self.total_frames} frames at {self.frame_rate} FPS")

    def get_VideoLabels(self):
      return self.cap, self.frame_rate, self.w, self.h


# def track_people(video_paths):

#     #'yolov8n.pt' (nano) or 'yolov8s.pt' for slightly better accuracy (takes more time but)
#     yolo = YOLO("yolov8n.pt")  

#     # _____ DeepSORT tracker ___
#     # max_age: Max number of frames to keep a lost track alive (if no detection).
#     # n_init: how many frames before confirming a track
#     # nn_budget: max gallery size for features
#     # tracker = DeepSort(max_age=30, n_init=3, nn_budget=100, embedder_gpu=False)
#     tracker = DeepSort(
#     max_age=40, n_init=3, nn_budget=30, embedder_gpu=False)

#     """max_cosine_distance = 0.25   # lower = stricter match; 0.2–0.3 works best for cross-view
#       nms_max_overlap = 0.45       # allow slight overlap between detections
#       min_confidence = 0.5         # ignore weak YOLO detections
# """


#     out_dir = "output_videos"
#     os.makedirs(out_dir, exist_ok=True)

#     all_frames = []
#     frame_size = None
#     fps = 0

#     # Read all videos and combine them
#     for path in video_paths:
#         vid = LoadVideo(path)
#         video_capture, fps, w, h = vid.get_VideoLabels()
#         frame_size = (w, h)
        
#         while True:
#           ret, frame = video_capture.read()
#           if ret is not True:
#               video_capture.release()
#               break
#           all_frames.append(frame)
        

#     print(f"Total combined frames: {len(all_frames)}")

#     # Output paths
   
#     combined_path = os.path.join(out_dir, "combined_output.avi")
#     fourcc = cv2.VideoWriter_fourcc(*'MJPG')
#     writer = cv2.VideoWriter(combined_path, fourcc, fps, frame_size)

#     # --- Process each frame ---
#     id_colors = {}
#     for i, frame in enumerate(all_frames):
#         results = yolo(frame, verbose=False)[0]  # Run detection on frame
#         detections = []

#         # --- Extract person detections only ---
#         for box in results.boxes:
#             cls_id = int(box.cls[0])
#             if yolo.model.names[cls_id].lower() != "person":
#                 continue
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             conf = float(box.conf[0])
#             detections.append(([x1, y1, x2 - x1, y2 - y1], conf, "person"))

#         # --- Update tracker ---
#         tracks = tracker.update_tracks(detections, frame=frame)

#         # --- Draw tracked boxes ---
#         for track in tracks:
#             if not track.is_confirmed():
#                 continue
#             track_id = track.track_id
#             ltrb = track.to_ltrb()
#             x1, y1, x2, y2 = map(int, ltrb)
#             if track_id not in id_colors:
#                 id_colors[track_id] = tuple(np.random.randint(0, 255, 3).tolist())

#             cv2.rectangle(frame, (x1, y1), (x2, y2), id_colors[track_id], 2)
#             cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.6, id_colors[track_id], 2)

#         # Write the frame to the output video
#         writer.write(frame)
#         print(f"Processed frame {i+1}/{len(all_frames)}", end="\r")

#     writer.release()
#     print(f"\nTracking complete! Output saved at: {combined_path}")
# Global gallery for cross-camera ReID
global_gallery = {}   # {global_id: feature_vector}
next_global_id = 1

# def find_best_match(feature_vec, threshold=0.8):
#     """Compare feature with stored gallery, return matched global ID if similar."""
#     global global_gallery
#     if not global_gallery:
#         return None

#     similarities = []
#     for gid, gallery_vec in global_gallery.items():
#         sim = cosine_similarity([feature_vec], [gallery_vec])[0][0]
#         similarities.append((gid, sim))

#     # Find highest similarity
#     best_gid, best_sim = max(similarities, key=lambda x: x[1])
#     if best_sim >= threshold:
#         return best_gid
#     return None
def track_people(video_paths):
    # Load YOLOv8 model
    yolo = YOLO("yolov8n.pt")  # or 'yolov8s.pt' for better accuracy

    # Initialize DeepSORT tracker
    tracker = DeepSort(max_age=200,      # keep lost tracks longer (so ID isn’t reset)
    n_init=3,        # confirm faster (for smoother ID assignment)
    nn_budget=150,   # store more appearance embeddings (helps reID)
    max_iou_distance=0.8,  # allow more overlap (helps if people are close)
    embedder="mobilenet",  # lightweight CPU-friendly embedder
    embedder_model_name="mobilenetv2_x1_0_imagenet",
    # embedder_wts="osnet_x0_25_market1501.pt",
    embedder_gpu=False)

    out_dir = "output_videos"
    os.makedirs(out_dir, exist_ok=True)

    # Process each video separately to avoid memory overflow
    for path in video_paths:
        print(f"\n🔹 Processing video: {path}")

        # --- Load video ---
        vid = LoadVideo(path)
        cap, fps, w, h = vid.get_VideoLabels()
        frame_size = (w, h)

        # Output file
        output_path = os.path.join(out_dir, f"{os.path.basename(path).split('.')[0]}_tracked.avi")
        fourcc = cv2.VideoWriter_fourcc(*'XVID')  # More reliable codec
        writer = cv2.VideoWriter(output_path, fourcc, fps, frame_size)

        id_colors = {}
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1

            # Run YOLO detection on the frame
            results = yolo(frame, conf=0.75, iou=0.45,verbose=False)[0]
            detections = []

            # Extract only "person" detections
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                if yolo.model.names[cls_id].lower() != "person" or conf < 0.55:
                    continue
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, "person"))

            # Update DeepSORT tracker
            tracks = tracker.update_tracks(detections, frame=frame)

            # Draw bounding boxes + IDs
            for track in tracks:
                if not track.is_confirmed():
                    continue
                track_id = track.track_id
                ltrb = track.to_ltrb()
                x1, y1, x2, y2 = map(int, ltrb)
                if track_id not in id_colors:
                    id_colors[track_id] = tuple(np.random.randint(0, 255, 3).tolist())

                cv2.rectangle(frame, (x1, y1), (x2, y2), id_colors[track_id], 2)
                cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, id_colors[track_id], 2)

            # Write processed frame directly to file
            writer.write(frame)

            if frame_count % 10 == 0:
                print(f"Processed {frame_count} frames", end="\r")

        cap.release()
        writer.release()
        print(f"\n✅ Finished {path}. Output saved to {output_path}")

    print("\n🎉 All videos processed successfully!")

# =============== Run Script ===============
if __name__ == "__main__":
    # List of your video files
    videos = [
        "./recordings/A - 1.MOV",
        "./recordings/A - 2.MOV"
    ]
    track_people(videos)
