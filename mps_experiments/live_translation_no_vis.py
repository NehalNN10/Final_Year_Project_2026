import torch
from ultralytics import YOLO
import numpy as np
import cv2
import json
import redis
import time

# ==========================================
# 0. SETUP & DEVICE
# ==========================================
try:
    redis_client = redis.Redis(
        host='3.109.201.41',
        port=6379,
        decode_responses=True,
        socket_connect_timeout=1,
        socket_keepalive=True,
        health_check_interval=5
    )
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠️ Redis unavailable: {e}")
    REDIS_AVAILABLE = False
    redis_client = None

device = 'mps' if torch.backends.mps.is_available() else 'cpu'
print(f"Using device: {device}")

MODEL = 'yolo11x-seg.pt'
CAM_1 = 'vids/sync_angle_1.mp4'
CAM_2 = 'vids/sync_angle_2.mp4'
CAM_3 = 'vids/sync_angle_3.mp4'
TRACKER_PATH = "custom_bytetrack.yaml"

shared_state = {"count": 18}

# ==========================================
# 1. LOAD CALIBRATIONS
# ==========================================
def load_calibration(npz_file):
    try:
        data = np.load(npz_file, allow_pickle=True)
        regions_img = {}
        homographies = {}
        for key in data.files:
            region_name = key.replace("poly_", "").replace("H_", "")
            if key.startswith("poly_"):
                regions_img[region_name] = data[key]
            elif key.startswith("H_"):
                homographies[region_name] = data[key]
        return regions_img, homographies
    except Exception as e:
        print(f"Warning: Could not load {npz_file}. Error: {e}")
        return {}, {}

print("Loading calibration maps...")
cam1_polys, cam1_H = load_calibration("homo_maps/cam1_calib.npz")
cam2_polys, cam2_H = load_calibration("homo_maps/cam2_calib.npz")
cam3_polys, cam3_H = load_calibration("homo_maps/cam3_calib.npz")

IBAD_DESK_GAP_REAL = np.array([(151*3.2, 248*3.2), (166*3.2, 263*3.2), (356*3.2, 188*3.2), (320*3.2, 182*3.2)], dtype=np.float32)
IBAD_DESK_GAP_IMG = np.array([(-1.5, 7.5), (-3.5, 7.5), (-3.5, 4.5), (-1.5, 4.5)], dtype=np.float32)
IBAD_HOMOGRAPHY, _ = cv2.findHomography(IBAD_DESK_GAP_REAL, IBAD_DESK_GAP_IMG)

USHNA_TABLE_SIDE_REAL = np.array([(782, 497), (797, 553), (606, 544), (597, 490)], dtype=np.float32)
USHNA_TABLE_SIDE_IMG = np.array([(3.25, 2), (3.25, 3), (7.75, 3), (7.75, 2)], dtype=np.float32)
USHNA_HOMOGRAPHY, _ = cv2.findHomography(USHNA_TABLE_SIDE_REAL, USHNA_TABLE_SIDE_IMG)

# ==========================================
# 2. LINE COUNTING (NO VISUALIZATION)
# ==========================================
def point_side(p, a, b):
    return (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])

def point_line_distance(P, A, B):
    return abs((B[1]-A[1])*P[0] - (B[0]-A[0])*P[1] + B[0]*A[1] - B[1]*A[0]) / max(1e-5, np.linalg.norm([B[1]-A[1], B[0]-A[0]]))

def within_segment_x(p, a, b, margin=20):
    xmin = min(a[0], b[0]) - margin
    xmax = max(a[0], b[0]) + margin
    return xmin <= p[0] <= xmax

class LineCounter:
    def __init__(self, cam_id, shared_state_dict):
        self.cam_id = cam_id
        self.people_state = {}
        self.state = shared_state_dict
        
        if cam_id == "CAM_1":
            self.v_line_a = (163, 967)
            self.v_line_b = (12, 491)
            self.inside_line_a = (130, 778)
            self.inside_line_b = (174, 903)
        elif cam_id == "CAM_2":
            self.out1_a = (1802, 720)
            self.out1_b = (2011, 704)
            self.h1_a = (1855, 694)
            self.h1_b = (1984, 686)
            self.out2_a = (909, 272)
            self.out2_b = (1019, 268)
            self.h2_a = (909, 278)
            self.h2_b = (1026, 280)

    def process_cam1(self, tid, foot):
        side_now = point_side(foot, self.v_line_a, self.v_line_b)
        dist_now = point_line_distance(foot, self.inside_line_a, self.inside_line_b)
        
        if tid not in self.people_state:
            self.people_state[tid] = {"side": side_now, "dist": dist_now, "counted": False}
        else:
            p_state = self.people_state[tid]
            crossed = p_state["side"] * side_now < 0
            
            if crossed and not p_state["counted"]:
                if dist_now < p_state["dist"]:
                    self.state["count"] += 1
                    print(f"[CAM 1] 🚶 ENTER → Count: {self.state['count']}")
                else:
                    self.state["count"] -= 1
                    print(f"[CAM 1] 🚶 EXIT → Count: {self.state['count']}")
                p_state["counted"] = True
            
            p_state["side"] = side_now
            p_state["dist"] = dist_now
            
    def process_cam2(self, tid, foot):
        out1_now = point_side(foot, self.out1_a, self.out1_b)
        h1_now   = point_side(foot, self.h1_a, self.h1_b)
        out2_now = point_side(foot, self.out2_a, self.out2_b)
        h2_now   = point_side(foot, self.h2_a, self.h2_b)
        
        if tid not in self.people_state:
            self.people_state[tid] = {"out1": out1_now, "h1": h1_now, "out2": out2_now, "h2": h2_now, "seq": None, "counted": False}
        else:
            p_state = self.people_state[tid]
            cross_out1 = p_state["out1"] * out1_now < 0 and within_segment_x(foot, self.out1_a, self.out1_b)
            cross_h1 = p_state["h1"] * h1_now < 0 and within_segment_x(foot, self.h1_a, self.h1_b)
            cross_out2 = p_state["out2"] * out2_now < 0
            cross_h2 = p_state["h2"] * h2_now < 0

            if not p_state["counted"]:
                if cross_out1: p_state["seq"] = "OUT1"
                elif cross_h1:
                    if p_state["seq"] == "OUT1":
                        self.state["count"] -= 1
                        print(f"[CAM 2 Door 1] 🚶 EXIT → Count: {self.state['count']}")
                    else:
                        self.state["count"] += 1
                        print(f"[CAM 2 Door 1] 🚶 ENTER → Count: {self.state['count']}")
                    p_state["counted"] = True

            if not p_state["counted"]:
                if cross_out2: p_state["seq"] = "OUT2"
                elif cross_h2:
                    if p_state["seq"] == "OUT2":
                        self.state["count"] += 1
                        print(f"[CAM 2 Door 2] 🚶 ENTER → Count: {self.state['count']}")
                    else:
                        self.state["count"] -= 1
                        print(f"[CAM 2 Door 2] 🚶 EXIT → Count: {self.state['count']}")
                    p_state["counted"] = True
                    
            p_state["out1"] = out1_now
            p_state["h1"] = h1_now
            p_state["out2"] = out2_now
            p_state["h2"] = h2_now

    def update(self, tid, foot):
        if self.cam_id == "CAM_1":
            self.process_cam1(tid, foot)
        elif self.cam_id == "CAM_2":
            self.process_cam2(tid, foot)

cam1_counter = LineCounter("CAM_1", shared_state)
cam2_counter = LineCounter("CAM_2", shared_state)

# ==========================================
# 3. CORE TRANSLATION (NO VIZ, NO FRAME COPY)
# ==========================================
def point_in_polygon(point, polygon):
    return cv2.pointPolygonTest(polygon.astype(np.int32), point, False) >= 0

def map_point(point_px, H_matrix):
    pt = np.array([[point_px]], dtype=np.float32)
    mapped = cv2.perspectiveTransform(pt, H_matrix)
    return mapped[0][0]

def process_and_translate_no_viz(cam_id, results, polys_dict, H_dict, state_dict, counter=None):
    """Process detections WITHOUT creating a copy of the frame or drawing anything"""
    
    if results[0].boxes.id is None:
        return
        
    boxes = results[0].boxes.xyxy.cpu().numpy()
    ids = results[0].boxes.id.cpu().numpy()

    for box, track_id in zip(boxes, ids):
        x1, y1, x2, y2 = map(int, box)
        
        px = (x1 + x2) / 2.0
        py = y2
        foot = (px, py)
        
        h = y2 - y1
        w = x2 - x1
        aspect_ratio = h / w if w > 0 else 0

        # Update counter BEFORE logic
        if counter:
            counter.update(int(track_id), foot)

        region_name = None
        world_xy = None

        # Determine region and map point
        for name, poly in polys_dict.items():
            if point_in_polygon(foot, poly):
                region_name = name
                if cam_id == "CAM_1":
                    if region_name == "WALKWAY_1":
                        displacement = -15 * aspect_ratio
                        new_foot = (px, py + displacement)
                        world_xy = map_point(new_foot, IBAD_HOMOGRAPHY)
                        break
                    elif region_name == "WALKWAY_25" and aspect_ratio < 1.8:
                        new_foot = (px, py)
                        world_xy = map_point(new_foot, USHNA_HOMOGRAPHY)
                        break
                
                world_xy = map_point(foot, H_dict[name])
                break

        # Only publish if we have valid data
        if world_xy is not None:
            wx, wz = world_xy
            payload = {
                "camera": cam_id,
                "id": int(track_id),
                "x": round(float(wx), 3),
                "z": round(float(wz), 3),
                "region": region_name,
                "occupancy": state_dict["count"]
            }
            
            if REDIS_AVAILABLE:
                try:
                    redis_client.publish("tracking_stream", json.dumps(payload))
                except Exception as e:
                    print(f"❌ Redis publish failed: {e}")
            
            print(f"📡 {cam_id} | Track {int(track_id)}: ({wx:.2f}, {wz:.2f}) | Occupancy: {state_dict['count']}")

# ==========================================
# 4. THE PROCESSING LOOP (OPTIMIZED)
# ==========================================
print("Loading Models...")
model_cam1 = YOLO(MODEL)
model_cam2 = YOLO(MODEL)
model_cam3 = YOLO(MODEL)

cap1 = cv2.VideoCapture(CAM_1)
cap2 = cv2.VideoCapture(CAM_2)
cap3 = cv2.VideoCapture(CAM_3)

print("🚀 Starting live translation stream (NO VISUALIZATION)...")
frame_count = 0
start_time = time.time()

while True:
    ret1, frame1 = cap1.read()
    ret2, frame2 = cap2.read()
    ret3, frame3 = cap3.read()

    if not (ret1 and ret2 and ret3):
        print("A video stream ended.")
        break

    # Run inference WITHOUT keeping frames in memory for display
    res1 = model_cam1.track(frame1, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)
    res2 = model_cam2.track(frame2, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)
    res3 = model_cam3.track(frame3, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)

    # Process ONLY the detections, no frame manipulation
    process_and_translate_no_viz("CAM_1", res1, cam1_polys, cam1_H, shared_state, counter=cam1_counter)
    process_and_translate_no_viz("CAM_2", res2, cam2_polys, cam2_H, shared_state, counter=cam2_counter)
    process_and_translate_no_viz("CAM_3", res3, cam3_polys, cam3_H, shared_state, counter=None)

    frame_count += 1
    
    # Log performance every 30 frames
    if frame_count % 30 == 0:
        elapsed = time.time() - start_time
        fps = frame_count / elapsed
        print(f"⏱️  Processed {frame_count} frames | FPS: {fps:.1f}")

cap1.release()
cap2.release()
cap3.release()
print("✅ Process shut down.")