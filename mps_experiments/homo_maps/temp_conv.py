import numpy as np
import cv2

# ====================================================
# 1. RAW DATA FOR CAMERA 3
# ====================================================
REGIONS_IMG = {
    "MAIN_VIEW": np.array([
        [92, 177],
        [14, 198],
        [103, 446],
        [722, 444],
        [786, 277],
        [677, 240],
        [488, 389],
        [149, 187],
        [172, 206]
    ], dtype=np.float32)
}

REGIONS_WORLD = {
    "MAIN_VIEW": np.array([
        [-4.05, -3.475],
        [-4.75, -3.475],
        [-4.75,  5.50],
        [-3.50,  8.25],
        [ 1.02,  8.25],
        [ 1.02,  7.025],
        [-4.05,  7.025],
        [-4.05,  1.275],
        [-4.05,  2.275]
    ], dtype=np.float32)
}

# ====================================================
# 2. COMPUTE & SAVE
# ====================================================
npz_data = {}

for region_name in REGIONS_IMG.keys():
    img_pts = REGIONS_IMG[region_name]
    world_pts = REGIONS_WORLD[region_name]
    
    # Calculate the Homography Matrix (uses all 9 points for a best-fit)
    H, status = cv2.findHomography(img_pts, world_pts)
    
    # We will compute the Convex Hull to create a proper boundary for the point-in-polygon check.
    # (Since adding inner table points makes the shape non-sequential)
    # hull_pts = cv2.convexHull(img_pts)
    
    npz_data[f"poly_{region_name}"] = img_pts
    npz_data[f"H_{region_name}"] = H

np.savez("cam3_calib.npz", **npz_data)
print("✅ Saved cam3_calib.npz successfully.")