import pandas as pd

# Load CSV files
df1 = pd.read_csv(
    "../3js_practice/projects_lab_2d/files/mapped_tracks_angle_1.csv")
df2 = pd.read_csv(
    "../3js_practice/projects_lab_2d/files/tracks_output_cam2_allframes.csv")
df3 = pd.read_csv("../3js_practice/projects_lab_2d/files/clamped_tracks.csv")


# Add camera/angle identifier
df1["camera"] = "cam1"
df2["camera"] = "cam2"
df3["camera"] = "cam3"

# Combine all rows
combined = pd.concat([df1, df2, df3], ignore_index=True)

# Sort by frame (and optionally by camera for consistency)
combined = combined.sort_values(by=["frame", "camera"]).reset_index(drop=True)

# Save
combined.to_csv(
    "../3js_practice/projects_lab_2d/files/combined_frames_2.csv", index=False)