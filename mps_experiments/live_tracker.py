import torch
import cv2
import numpy as np
import redis
import json
import threading
from ultralytics import YOLO

# =========================
# 1. INITIALIZE MPS & REDIS
# =========================
print("--- System Check ---")
if torch.backends.mps.is_available():
    print("🚀 MPS is available! Apple Silicon GPU is ready.")
else:
    print("❌ MPS is not available. Falling back to CPU.")

# --- Redis Config ---
REDIS_HOST = '13.204.143.167' # <-- YOUR EC2 IP HERE
REDIS_PORT = 6379

try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.ping()
    print("✅ Successfully connected to EC2 Redis!")
except redis.ConnectionError as e:
    print(f"❌ Could not connect to Redis: {e}")
    # exit(1) # Uncomment to force quit if Redis fails

# =========================
# 2. CONFIGURATION & MODELS
# =========================
VIDEO_PATH = "rtsp://admin:Habib_Test@192.168.1.64:554/Streaming/Channels/101/"
MODEL_PATH = "yolo11x.pt"

model = YOLO(MODEL_PATH)
cap = cv2.VideoCapture(VIDEO_PATH)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 2) 

# =========================
# 3. ASYNC PUBLISH FUNCTION
# =========================
def publish_async(payload):
    """Runs in the background to send data without freezing the video stream"""
    try:
        json_data = json.dumps(payload)
        # Publishing to 'live_detections' channel
        redis_client.publish('live_detections', json_data)
    except redis.ConnectionError:
        pass # Silently fail so we don't spam the console if the network blips

# =========================
# 4. MAIN REAL-TIME LOOP
# =========================
print("🎥 Starting live tracking... Press 'q' to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Lost connection to RTSP stream.")
        break
    
    results = model.track(
        frame, conf=0.5, iou=0.5, classes=[0], 
        persist=True, tracker="bytetrack.yaml", 
        device="mps", verbose=False
    )
    
    orig = frame.copy()
    
    # 🌟 Initialize an empty list for this specific frame
    frame_payload = []

    for r in results:
        if r.boxes.id is None:
            continue

        boxes  = r.boxes.xyxy.cpu().numpy()
        ids    = r.boxes.id.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        
        # Total people detected in this frame
        current_occupancy = len(ids)

        for (x1, y1, x2, y2), pid, score in zip(boxes, ids, scores):
            x1, y1, x2, y2 = map(int, (x1, y1, x2, y2))
            
            # Calculate "feet"
            px = (x1 + x2) // 2
            py = y2
            
            # 🌟 Add this person's raw camera coordinates to the payload
            frame_payload.append({
                "id": int(pid),
                "x": float(px),  # Mapping raw px to x
                "z": float(py),  # Mapping raw py to z
                "occupancy": current_occupancy,
                "region": "Raw Camera View" # Placeholder for homography later
            })

            # Draw visuals
            cv2.rectangle(orig, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.circle(orig, (px, py), 5, (0, 0, 255), -1)
            label = f"ID: {int(pid)} | Conf: {score:.2f}"
            cv2.putText(orig, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # 🌟 Fire and Forget: Send data to AWS in the background!
    # if frame_payload:
    threading.Thread(target=publish_async, args=(frame_payload,), daemon=True).start()

    cv2.imshow("Live YOLO Detections", orig)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("🛑 'q' pressed. Shutting down live feed...")
        break

cap.release()
cv2.destroyAllWindows()
print("✅ Processing complete")