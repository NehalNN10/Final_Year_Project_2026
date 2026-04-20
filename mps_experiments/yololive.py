import torch
import cv2
import numpy as np
from ultralytics import YOLO
import os

# =========================
# 1. INITIALIZE MPS (APPLE SILICON GPU)
# =========================
print("--- System Check ---")
if torch.backends.mps.is_available():
    print("🚀 MPS is available! Apple Silicon GPU is ready.")
else:
    print("❌ MPS is not available. Falling back to CPU.")

# =========================
# 2. CONFIGURATION
# =========================
# Swap to your actual Hikvision password
# VIDEO_PATH = os.get_env("RTSP_URL")
VIDEO_PATH = "rtsp://admin:Habib_Test@192.168.1.64:554/Streaming/Channels/101/"
MODEL_PATH = "yolo11x.pt"

# =========================
# 3. LOAD MODEL & VIDEO
# =========================
model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)
# CRITICAL FOR RTSP: Limits buffer to prevent massive lag over time
cap.set(cv2.CAP_PROP_BUFFERSIZE, 2) 

# =========================
# 4. MAIN REAL-TIME LOOP
# =========================
print("🎥 Starting live tracking... Press 'q' to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Lost connection to RTSP stream.")
        break
    
    # Run YOLO using the Mac's GPU
    results = model.track(
        frame,
        conf=0.5,
        iou=0.5,
        classes=[0], # Class 0 = Person
        persist=True,
        tracker="bytetrack.yaml",
        device="mps", 
        verbose=False
    )
    
    # We draw on a copy of the frame to keep the original clean
    orig = frame.copy()

    for r in results:
        # Skip if no tracking IDs are assigned yet
        if r.boxes.id is None:
            continue

        # Extract bounding boxes, IDs, and confidence scores
        boxes  = r.boxes.xyxy.cpu().numpy()
        ids    = r.boxes.id.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()

        for (x1, y1, x2, y2), pid, score in zip(boxes, ids, scores):
            x1, y1, x2, y2 = map(int, (x1, y1, x2, y2))
            
            # Calculate the "foot" of the person (bottom center of bounding box)
            px = (x1 + x2) // 2
            py = y2

            # Draw the bounding box
            cv2.rectangle(orig, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw a red dot exactly where the feet touch the floor
            cv2.circle(orig, (px, py), 5, (0, 0, 255), -1)

            # Draw the tracking ID and Confidence Score
            label = f"ID: {int(pid)} | Conf: {score:.2f}"
            cv2.putText(orig, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # DISPLAY LIVE FEED
    cv2.imshow("Live YOLO Detections", orig)

    # Wait 1ms and check if 'q' is pressed to quit the window
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("🛑 'q' pressed. Shutting down live feed...")
        break

# =========================
# 5. CLEANUP
# =========================
cap.release()
cv2.destroyAllWindows()
print("✅ Processing complete")