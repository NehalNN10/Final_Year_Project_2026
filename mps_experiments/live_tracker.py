import torch
import cv2
import numpy as np
import redis
import json
import threading
import time # 🌟 NEW: Needed for FPS calculation
from ultralytics import YOLO

# =========================
# 1. INITIALIZE MPS & REDIS
# =========================
print("--- System Check ---")
if torch.backends.mps.is_available():
    print("🚀 MPS is available! Apple Silicon GPU is ready.")
else:
    print("❌ MPS is not available. Falling back to CPU.")

REDIS_HOST = '13.204.143.167' 
REDIS_PORT = 6379


#SCALING
ORIG_W = 3024
ORIG_H = 1706


try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.ping()
    print("✅ Successfully connected to EC2 Redis!")
except redis.ConnectionError as e:
    print(f"❌ Could not connect to Redis: {e}")

# =========================
# 2. CONFIGURATION & MODELS
# =========================


COUNT_COOLDOWN = 15


#══════════════════════════════════════════════════════════════
# HELPERS
#══════════════════════════════════════════════════════════════

def point_side(p, a, b):
    return (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])

def within_segment(p, a, b, margin=30):
    xmin = min(a[0], b[0]) - margin
    xmax = max(a[0], b[0]) + margin
    ymin = min(a[1], b[1]) - margin
    ymax = max(a[1], b[1]) + margin

    return (
        xmin <= p[0] <= xmax and
        ymin <= p[1] <= ymax
    )

def crossed_line(prev_side, curr_side, foot, a, b):

    if prev_side is None:
        return False

    if prev_side == 0 or curr_side == 0:
        return False

    crossed = prev_side * curr_side < 0

    if crossed:
        return within_segment(foot, a, b)

    return False

def point_in_polygon(point, polygon):

    result = cv2.pointPolygonTest(
        polygon,
        (float(point[0]), float(point[1])),
        False
    )

    return result >= 0

def get_polygon_zone(foot):

    if point_in_polygon(foot, INNER_POLYGON):
        return "inner"

    elif point_in_polygon(foot, OUTER_POLYGON):
        return "outer"

    return None

def can_count(tid, frame_idx, last_count_frame):

    last_frame = last_count_frame.get(tid, -9999)

    return (frame_idx - last_frame) >= COUNT_COOLDOWN


VIDEO_PATH = "rtsp://admin:Habib_Test@192.168.1.64:554/Streaming/Channels/101/"
MODEL_PATH = "yolo11x.pt"

model = YOLO(MODEL_PATH)
cap = cv2.VideoCapture(VIDEO_PATH)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 2) 


NEW_W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
NEW_H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))


if NEW_W > 0 and NEW_H > 0:
    scale_x = NEW_W / ORIG_W
    scale_y = NEW_H / ORIG_H
else:
    print("Fallback to 1920x1080 for demonstration.")
    scale_x = 1920 / ORIG_W
    scale_y = 1080 / ORIG_H



# Helper function to scale a single (x, y) tuple
def scale_point(pt):
    return (int(pt[0] * scale_x), int(pt[1] * scale_y))



# Original Line Coordinates
orig_inner_a = (2001, 1578)
orig_inner_b = (495, 1436)
orig_outer_a = (1998, 1629)
orig_outer_b = (474, 1478)

# Scaled Line Coordinates
INNER_A = scale_point(orig_inner_a)
INNER_B = scale_point(orig_inner_b)
OUTER_A = scale_point(orig_outer_a)
OUTER_B = scale_point(orig_outer_b)

# Scaled Polygon Zones
# Note: You can scale the extra polygon points directly inline using the helper function
INNER_POLYGON = np.array([
    INNER_A,
    INNER_B,
    scale_point((495, 1358)),
    scale_point((2001, 1500)),
], dtype=np.int32)

OUTER_POLYGON = np.array([
    OUTER_A,
    OUTER_B,
    scale_point((474, 1556)),
    scale_point((1998, 1707)),
], dtype=np.int32)


REGIONS_IMG = {
    "WALKWAY_1": np.array(
        [scale_point((471, 1488)), scale_point((1993, 1625)), scale_point((1899, 977)), scale_point((916, 938))], dtype=np.float32
    ),
    "WALKWAY_2": np.array(
        [scale_point((1899, 977)), scale_point((916, 938)), scale_point((1068, 778)), scale_point((1872, 809))], dtype=np.float32
    ),
    "WALKWAY_3": np.array(
        [scale_point((1068, 778)), scale_point((1872, 809)), scale_point((1841, 638)), scale_point((1197, 622))], dtype=np.float32
    ),
    "WALKWAY_4": np.array(
        [
            scale_point((471, 1488)),
            scale_point((916, 938)),
            scale_point((885, 661)),
            scale_point((362, 1113)),
        ],
        dtype=np.float32,
    ),
    "WALKWAY_5": np.array(
        [
            scale_point((916, 938)),
            scale_point((1068, 778)),
            scale_point((1072, 544)),
            scale_point((885, 661)),
        ],
        dtype=np.float32,
    ),
    "WALKWAY_6": np.array(
        [
            scale_point((1068, 778)),
            scale_point((1197, 622)),
            scale_point((1166, 419)),
            scale_point((1072, 544)),
        ],
        dtype=np.float32,
    ),
   
        "WALKWAY_7": np.array(
        [ scale_point((1197, 622)), scale_point((1197, 423)),scale_point((1841, 423)),scale_point((1841, 638))], dtype=np.float32
    ),
}

REGIONS_WORLD = {
    "WALKWAY_1": np.array(
        [(2.4, -1.3), (2.0, 1.2), (4.2, 1.2), (4.7, -1.2)], dtype=np.float32
    ),
    "WALKWAY_2": np.array(
        [(4.2, 1.2), (4.7, -1.2), (5.9, -1.2), (5.9, 1.2)], dtype=np.float32
    ),
    "WALKWAY_3": np.array(
        [(5.9, -1.2), (5.9, 1.2), (7.4, 1.2), (7.4, -1.3)], dtype=np.float32
    ),
    "WALKWAY_4": np.array(
        [
            (2.4, -1.3),
            (4.7, -1.2),
            (4.7, -1.3),
            (2.4, -1.4),
        ],
        dtype=np.float32,
    ),
    "WALKWAY_5": np.array(
        [(4.7, -1.2), (5.9, -1.2), (5.9, -1.3), (4.7, -1.3)], dtype=np.float32
    ),
    "WALKWAY_6": np.array(
        [
            (5.9, -1.2),
            (7.5, -1.3),
            (7.5, -1.4),
            (5.9, -1.3),
        ],
        dtype=np.float32,
    ),
     "WALKWAY_7": np.array(
        [ (7.4, -1.3), (7.5, -1.3),(7.4, 1.2),(7.3, 1.2)], dtype=np.float32
    ),

}


# =========================
# HOMOGRAPHIES
# =========================
HOMOGRAPHIES = {}

for name in REGIONS_IMG:
    H, _ = cv2.findHomography(REGIONS_IMG[name], REGIONS_WORLD[name])
    HOMOGRAPHIES[name] = H

# =========================
# HELPERS
# =========================
def point_in_polygon(point, polygon):
    return cv2.pointPolygonTest(polygon.astype(np.int32), point, False) >= 0


def map_point(point_px, H):
    pt = np.array([[point_px]], dtype=np.float32)
    mapped = cv2.perspectiveTransform(pt, H)
    return mapped[0][0]



# =========================
# 3. ASYNC PUBLISH FUNCTION
# =========================
def publish_async(payload):
    try:
        json_data = json.dumps(payload)
        redis_client.publish('live_detections', json_data)
    except redis.ConnectionError:
        pass 

# =========================
# 4. MAIN REAL-TIME LOOP
# =========================

people_state = {}
last_count_frame = {}

count = 0
frame_idx = 0

log_data = []

print("🎥 Starting live tracking... Press 'q' to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Lost connection to RTSP stream.")
        break
    
    # 🌟 1. Start the FPS timer
    start_time = time.time()
    
    results = model.track(
        frame, conf=0.5, iou=0.5, classes=[0], 
        persist=True, tracker="bytetrack.yaml", 
        device="mps", verbose=False
    )



    # initialize count via very first frame
    if frame_idx == 0:
        if len(results) > 0 and results[0].boxes.id is not None:
            count = len(results[0].boxes.id)
            print(f"🔄 Initialized room count to {count} based on Frame 0.")
        else:
            count = 0
    
    # 🌟 2. Calculate FPS
    fps = 1.0 / (time.time() - start_time)
    
    orig = frame.copy()
           # Draw regions
    for name, poly in REGIONS_IMG.items():

        cv2.polylines(orig, [poly.astype(np.int32)], True, (255, 0, 0), 2)

        cx, cy = np.mean(poly, axis=0).astype(int)

        cv2.putText(
            orig, name, (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2
        )



    frame_payload = []

    # 🌟 3. Extract Latency Metrics (from the first result object)
    speed_inference = 0.0
    total_latency = 0.0
    if len(results) > 0:
        speeds = results[0].speed
        speed_inference = speeds.get('inference', 0.0)
        total_latency = speeds.get('preprocess', 0.0) + speed_inference + speeds.get('postprocess', 0.0)
    
    current_ids = set()
    count_updated = False

    for r in results:
        if r.boxes.id is None:
            continue

        boxes  = r.boxes.xyxy.cpu().numpy()
        ids    = r.boxes.id.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        current_occupancy = len(ids)

        for (x1, y1, x2, y2), pid, score in zip(boxes, ids, scores):


            x1, y1, x2, y2 = map(int, (x1, y1, x2, y2))
            px = (x1 + x2) // 2
            py = y2

            tid = int(pid)
            current_ids.add(tid)

            # FOOT POINT
            foot = ((x1 + x2) // 2, y2)

            region_name = None
            world_xy = None

            # Find which region contains point
            for name, poly in REGIONS_IMG.items():

                if point_in_polygon(foot, poly):

                    region_name = name
                    world_xy = map_point(foot, HOMOGRAPHIES[name])
                    break

            # Color based on mapped/not mapped
            color = (0, 255, 0) if region_name else (0, 0, 255)
           # Draw bbox
            cv2.rectangle(orig, (x1, y1), (x2, y2), color, 2)

            # Draw foot point
            cv2.circle(orig, foot, 4, (0, 255, 255), -1)

            if world_xy is not None:
                wx, wy = world_xy
                label = f"ID {tid} | {region_name} | ({wx:.2f}, {wy:.2f})"
                
                # 🌟 ONLY ADD TO PAYLOAD IF THEY HAVE VALID COORDS
                frame_payload.append({
                    "id": int(pid),
                    "x": float(wx),  
                    "z": float(wy),  
                    "occupancy": current_occupancy,
                    "region": region_name # Uses the real region name now!
                })
            else:
                label = f"ID {tid} | OUT OF BOUNDS"
                # If they are out of bounds, we do NOT add them to the payload.

            cv2.putText(
                orig, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
            )


            # tweak
            # inside = cv2.pointPolygonTest(ROI_POLY.astype(np.int32), (float(feet_x), float(feet_y)), False)

            # if inside < 0:
            #     continue

            # CURRENT SIDES
            inner_side_now = point_side(foot, INNER_A, INNER_B)
            outer_side_now = point_side(foot, OUTER_A, OUTER_B)

            # CURRENT POLYGON ZONE
            current_zone = get_polygon_zone(foot)

            #──────────────────────────────────────────────────
            # NEW PERSON
            #──────────────────────────────────────────────────

            if tid not in people_state:

                people_state[tid] = {
                    "inner_side": inner_side_now,
                    "outer_side": outer_side_now,
                    "zone": current_zone,
                    "seq": None,
                }

                continue

            state = people_state[tid]
           
            last_zone = state["zone"]
            if tid == 18 and (frame_idx > 580):
                print(state,last_zone, f"frame idx: {frame_idx}")

            #──────────────────────────────────────────────────
            # LINE CROSS DETECTION
            #──────────────────────────────────────────────────

            cross_inner = crossed_line(
                state["inner_side"],
                inner_side_now,
                foot,
                INNER_A,
                INNER_B
            )

            cross_outer = crossed_line(
                state["outer_side"],
                outer_side_now,
                foot,
                OUTER_A,
                OUTER_B
            )

            #══════════════════════════════════════════════════
            # START SEQUENCE
            #══════════════════════════════════════════════════

            if state["seq"] is None:

                if cross_outer and not cross_inner:

                   
                    state["seq"] = "outer_first"
                    #print(f"Outer crossed first  ID:{tid}",f"frame idx: {frame_idx}")
                                # EXIT
               
                elif cross_inner and not cross_outer:

                    state["seq"] = "inner_first"

                    #print(f"Inner crossed first  ID:{tid}")

            #══════════════════════════════════════════════════
            # ENTER LOGIC
            #
            # 1. outer line → inner line
            # 2. crossed outer line → inner polygon
            # ═══════════════════════════════════════════════════

            elif state["seq"] == "outer_first":

                # RULE 1
                if cross_inner:

                    if can_count(tid, frame_idx, last_count_frame):

                        count += 1
                        count_updated = True

                        #print(f"🚶 ENTER line→line  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

                    state["seq"] = None

                # RULE 2
                elif current_zone == "inner":

                    if can_count(tid, frame_idx, last_count_frame):

                        count += 1
                        count_updated = True

                        #print(f"⚡ ENTER line→inner polygon  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

                    state["seq"] = None

            #══════════════════════════════════════════════════
            # EXIT LOGIC
            #
            # 1. inner line → outer line
            # 2. crossed inner line → outer polygon
            # ═══════════════════════════════════════════════════

            elif state["seq"] == "inner_first":

                # RULE 1
                if cross_outer:

                    if can_count(tid, frame_idx, last_count_frame):

                        count -= 1
                        count_updated = True

                        #print(f"🚶 EXIT line→line  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

                    state["seq"] = None

                # RULE 2
                elif current_zone == "outer":

                    if can_count(tid, frame_idx, last_count_frame):

                        count -= 1
                        count_updated = True

                        #print(f"⚡ EXIT line→outer polygon  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

                    state["seq"] = None

            #══════════════════════════════════════════════════
            # POLYGON → POLYGON FALLBACK
            #
            # ENTER:
            #   outer polygon → inner polygon
            #
            # EXIT:
            #   inner polygon → outer polygon
            #═════════════════════════════════════════════════

            if state["seq"] is None:

                # ENTER
                if last_zone == "outer" and current_zone == "inner":

                    if can_count(tid, frame_idx, last_count_frame):

                        count += 1
                        count_updated = True

                        #print(f"🔷 ENTER polygon→polygon  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

                # EXIT
                elif last_zone == "inner" and current_zone == "outer":

                    if can_count(tid, frame_idx, last_count_frame):

                        count -= 1
                        count_updated = True

                        #print(f"🔷 EXIT polygon→polygon  total:{count}  ID:{tid}")

                        last_count_frame[tid] = frame_idx

            #──────────────────────────────────────────────────
            # UPDATE STATE
            #──────────────────────────────────────────────────

            state["inner_side"] = inner_side_now
            state["outer_side"] = outer_side_now
            state["zone"] = current_zone

            # feet_x = foot[0]
            # feet_y = foot[1]
            # # model_x, model_z = apply_homography(H_MATRIX, px, py, scale_x, scale_y)
            # cam_pt = np.array([[[feet_x, feet_y]]], dtype=np.float32)
            # world_pt = cv2.perspectiveTransform(cam_pt, H_world)
            # model_x = float(world_pt[0][0][0])
            # model_z = float(world_pt[0][0][1])

            # wx = float(wx)
            # wy = float(wy)
            # print(f"ID {tid} | World Coords: ({wx:.2f}, {wy:.2f}) | Region: {region_name}")
            # frame_payload.append({
            #     "id": int(pid),
            #     "x": wx,  
            #     "z": wy,  
            #     "occupancy": current_occupancy,
            #     "region": "Raw Camera View" 
            # })

            cv2.rectangle(orig, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.circle(orig, (px, py), 5, (0, 0, 255), -1)
            label = f"ID: {int(pid)} | Conf: {score:.2f}"
            cv2.putText(orig, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    #══════════════════════════════════════════════════════════
    # CLEAN LOST IDS
    #══════════════════════════════════════════════════════════

    lost_ids = set(people_state.keys()) - current_ids

    for tid in lost_ids:
        del people_state[tid]

    cv2.line(
        orig,
        INNER_A,
        INNER_B,
        (0, 255, 255),
        3
    )

    cv2.line(
        orig,
        OUTER_A,
        OUTER_B,
        (255, 0, 255),
        3
    )

    # ═══════════════════════════════════════════════════════════
    # DRAW POLYGONS
    # ═══════════════════════════════════════════════════════════

    overlay = orig.copy()

    cv2.fillPoly(
        overlay,
        [INNER_POLYGON],
        (0, 255, 255)
    )

    cv2.fillPoly(
        overlay,
        [OUTER_POLYGON],
        (255, 0, 255)
    )

    cv2.addWeighted(
        overlay,
        0.15,
        orig,
        0.85,
        0,
        orig
    )

    cv2.polylines(
        orig,
        [INNER_POLYGON],
        True,
        (0, 255, 255),
        2
    )

    cv2.polylines(
        orig,
        [OUTER_POLYGON],
        True,
        (255, 0, 255),
        2
    )

  
    # update master payload
    master_payload = {
        "room_count": count,            # The persistent line-logic count
        "detections": frame_payload     # The array of current bounding boxes
    }

    # Fire and Forget the Master Payload to Redis
    threading.Thread(target=publish_async, args=(master_payload,), daemon=True).start()

    # ==========================================
    # 🌟 4. DRAW METRICS HUD ON THE VIDEO
    # ==========================================
    # Draw a black background rectangle so the text is readable
    cv2.rectangle(orig, (10, 10), (450, 100), (0, 0, 0), -1)
    
    # Render the text
    cv2.putText(orig, f"FPS: {fps:.1f}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(orig, f"Inference: {speed_inference:.1f}ms", (180, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(orig, f"Total Latency: {total_latency:.1f}ms", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
    cv2.putText(
        orig,
        f"People Inside: {count}",
        (50, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (0, 0, 255),
        4
    )
    frame_idx += 1
    # DISPLAY LIVE FEED
    cv2.imshow("Live YOLO Detections", orig)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("🛑 'q' pressed. Shutting down live feed...")
        break

cap.release()
cv2.destroyAllWindows()
print("✅ Processing complete")