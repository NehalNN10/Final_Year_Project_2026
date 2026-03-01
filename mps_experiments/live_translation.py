import torch
from ultralytics import YOLO
import numpy as np
import cv2
import json
import redis

# ==========================================
# 0. SETUP & DEVICE
# ==========================================
try:
    redis_client = redis.Redis(
        host='3.109.201.41',
        port=6379,
        decode_responses=True,
        socket_connect_timeout=1,  # 1 second timeout
        socket_keepalive=True,
        health_check_interval=5
    )
    redis_client.ping()  # Test immediately
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠️ Redis unavailable: {e} - continuing without Redis")
    REDIS_AVAILABLE = False
    redis_client = None

device = 'mps' if torch.backends.mps.is_available() else 'cpu'
print(f"Using device: {device}")

MODEL = 'yolo11x-seg.pt' # Kept your segmentation model
CAM_1 = 'vids/sync_angle_1.mp4'
CAM_2 = 'vids/sync_angle_2.mp4'
CAM_3 = 'vids/sync_angle_3.mp4'
TRACKER_PATH = "custom_bytetrack.yaml"

# --- GLOBAL SHARED STATE ---
# This dictionary will be shared across all cameras to keep the count synced.
shared_state = {"count": 18}

# ==========================================
# 1. LOAD CALIBRATIONS HELPER & HALF-PERSON MATRICES
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

# --- OPTIMIZATION: Calculate Half-Person Matrices ONCE globally ---
IBAD_DESK_GAP_REAL = np.array([(151*3.2, 248*3.2), (166*3.2, 263*3.2), (356*3.2, 188*3.2), (320*3.2, 182*3.2)], dtype=np.float32)
IBAD_DESK_GAP_IMG = np.array([(-1.5, 7.5), (-3.5, 7.5), (-3.5, 4.5), (-1.5, 4.5)], dtype=np.float32)
IBAD_HOMOGRAPHY, _ = cv2.findHomography(IBAD_DESK_GAP_REAL, IBAD_DESK_GAP_IMG)

USHNA_TABLE_SIDE_REAL = np.array([(782, 497), (797, 553), (606, 544), (597, 490)], dtype=np.float32)
USHNA_TABLE_SIDE_IMG = np.array([(3.25, 2), (3.25, 3), (7.75, 3), (7.75, 2)], dtype=np.float32)
USHNA_HOMOGRAPHY, _ = cv2.findHomography(USHNA_TABLE_SIDE_REAL, USHNA_TABLE_SIDE_IMG)


# ==========================================
# 2. LINE COUNTING STATE MACHINE
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
        self.state = shared_state_dict  # Reference to the global dictionary
        
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
                    print(f"[CAM 1] 🚶 ENTER → Global Count: {self.state['count']}")
                else:
                    self.state["count"] -= 1
                    print(f"[CAM 1] 🚶 EXIT → Global Count: {self.state['count']}")
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
                        print(f"[CAM 2 Door 1] 🚶 EXIT → Global Count: {self.state['count']}")
                    else:
                        self.state["count"] += 1
                        print(f"[CAM 2 Door 1] 🚶 ENTER → Global Count: {self.state['count']}")
                    p_state["counted"] = True

            if not p_state["counted"]:
                if cross_out2: p_state["seq"] = "OUT2"
                elif cross_h2:
                    if p_state["seq"] == "OUT2":
                        self.state["count"] += 1
                        print(f"[CAM 2 Door 2] 🚶 ENTER → Global Count: {self.state['count']}")
                    else:
                        self.state["count"] -= 1
                        print(f"[CAM 2 Door 2] 🚶 EXIT → Global Count: {self.state['count']}")
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

    def draw_lines(self, frame):
        if self.cam_id == "CAM_1":
            cv2.line(frame, self.v_line_a, self.v_line_b, (0, 255, 255), 4)
            cv2.line(frame, self.inside_line_a, self.inside_line_b, (255, 0, 255), 4)
        elif self.cam_id == "CAM_2":
            cv2.line(frame, self.out1_a, self.out1_b, (255, 255, 0), 3)
            cv2.line(frame, self.h1_a, self.h1_b, (0, 255, 255), 4)
            cv2.line(frame, self.out2_a, self.out2_b, (255, 0, 255), 3)
            cv2.line(frame, self.h2_a, self.h2_b, (0, 0, 255), 3)
            
        cv2.putText(frame, f"Occupancy: {self.state['count']}", (50, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)

# Instantiate Counters passing the shared dictionary
cam1_counter = LineCounter("CAM_1", shared_state)
cam2_counter = LineCounter("CAM_2", shared_state)

# ==========================================
# 3. CORE TRANSLATION & DRAWING LOGIC
# ==========================================
def point_in_polygon(point, polygon):
    return cv2.pointPolygonTest(polygon.astype(np.int32), point, False) >= 0

def map_point(point_px, H_matrix):
    pt = np.array([[point_px]], dtype=np.float32)
    mapped = cv2.perspectiveTransform(pt, H_matrix)
    return mapped[0][0]

def draw_regions(frame, polys_dict):
    for name, poly in polys_dict.items():
        cv2.polylines(frame, [poly.astype(np.int32)], isClosed=True, color=(255, 0, 0), thickness=2)
        cx, cy = np.mean(poly, axis=0).astype(int)
        cv2.putText(frame, name, (cx - 20, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

def process_and_translate(cam_id, frame, results, polys_dict, H_dict, state_dict, rescale_to_800=False, counter=None):
    scale_factor = 2560/800
    scaled_polys = {}
    for key, poly in polys_dict.items():
        if rescale_to_800:
            scaled_poly = poly * scale_factor
        else:
            scaled_poly = poly
        scaled_polys[key] = scaled_poly

    draw_regions(frame, scaled_polys)
    if counter:
        counter.draw_lines(frame)

    scale_x, scale_y = 1.0, 1.0

    if results[0].boxes.id is None:
        return frame 
        
    boxes = results[0].boxes.xyxy.cpu().numpy()
    ids = results[0].boxes.id.cpu().numpy()

    for box, track_id in zip(boxes, ids):
        x1, y1, x2, y2 = map(int, box)
        math_x1, math_x2 = x1 * scale_x, x2 * scale_x
        math_y1, math_y2 = y1 * scale_y, y2 * scale_y

        px = (math_x1 + math_x2) / 2.0
        py = math_y2
        foot = (px, py)
        
        # aspect ratio calculation
        h = y2 - y1
        w = x2 - x1
        aspect_ratio = h / w if w > 0 else 0

        # Update counter BEFORE logic
        if counter:
            counter.update(int(track_id), foot)

        region_name = None
        world_xy = None

        # Determine region
        for name, poly in scaled_polys.items():
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
                
                # Standard homography mapping for all other cases
                world_xy = map_point(foot, H_dict[name])
                break

        if world_xy is not None:
            wx, wz = world_xy
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"ID:{int(track_id)} | X:{wx:.1f}, Z:{wz:.1f}"

            payload = {
                "camera": cam_id,
                "id": int(track_id),
                "x": round(float(wx), 3),
                "z": round(float(wz), 3),
                "region": region_name,
                "occupancy": state_dict["count"]  # Fetched directly from shared state
            }
            
            # Non-blocking Redis publish
            if REDIS_AVAILABLE:
                try:
                    redis_client.publish("tracking_stream", json.dumps(payload))
                except Exception as e:
                    print(f"❌ Redis publish failed: {e}")
            
            print(f"📡 BROADCAST: {json.dumps(payload)}")
        else:
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            label = f"ID:{int(track_id)} | Out"
        
        cv2.putText(frame, label, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        draw_px = int((x1 + x2) / 2.0)
        draw_py = int(y2)
        cv2.circle(frame, (draw_px, draw_py), radius=5, color=(0, 255, 255), thickness=-1)

    return frame

# ==========================================
# 4. THE PROCESSING LOOP
# ==========================================
print("Loading Models into M4 Memory...")
model_cam1 = YOLO(MODEL) 
model_cam2 = YOLO(MODEL)
model_cam3 = YOLO(MODEL)

cap1 = cv2.VideoCapture(CAM_1)
cap2 = cv2.VideoCapture(CAM_2)
cap3 = cv2.VideoCapture(CAM_3)

print("Starting live translation stream...")

CAM1_RESCALE = False 
CAM2_RESCALE = False
CAM3_RESCALE = True 

target_height = 400
def resize_for_display(frame):
    h, w = frame.shape[:2]
    aspect_ratio = w / h
    return cv2.resize(frame, (int(target_height * aspect_ratio), target_height))

while True:
    ret1, frame1 = cap1.read()
    ret2, frame2 = cap2.read()
    ret3, frame3 = cap3.read()

    if not (ret1 and ret2 and ret3):
        print("A video stream ended.")
        break

    res1 = model_cam1.track(frame1, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)
    res2 = model_cam2.track(frame2, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)
    res3 = model_cam3.track(frame3, persist=True, device=device, tracker=TRACKER_PATH, classes=[0], verbose=False)

    # Pass the shared_state dictionary to all processing functions
    viz1 = process_and_translate("CAM_1", frame1.copy(), res1, cam1_polys, cam1_H, shared_state, rescale_to_800=CAM1_RESCALE, counter=cam1_counter)
    viz2 = process_and_translate("CAM_2", frame2.copy(), res2, cam2_polys, cam2_H, shared_state, rescale_to_800=CAM2_RESCALE, counter=cam2_counter)
    viz3 = process_and_translate("CAM_3", frame3.copy(), res3, cam3_polys, cam3_H, shared_state, rescale_to_800=CAM3_RESCALE)

    viz1_disp = resize_for_display(viz1)
    viz2_disp = resize_for_display(viz2)
    viz3_disp = resize_for_display(viz3)

    dashboard = np.hstack((viz1_disp, viz2_disp, viz3_disp))
    # cv2.imshow("Multi-Cam Verification Console", dashboard)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap1.release()
cap2.release()
cap3.release()
cv2.destroyAllWindows()
print("Process shut down.")