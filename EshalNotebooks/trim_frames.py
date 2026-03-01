import pandas as pd

# File paths
input_path = "3js_practice/projects_lab_2d/temp_files_15min/cam3.csv"
output_path = "3js_practice/projects_lab_2d/temp_files_15min/cam3_shifted.csv"

# Read cam3 tracks
df = pd.read_csv(input_path)

# Shift frames back by 200
df["frame"] = df["frame"] - 200

# Remove negative frames (important)
df = df[df["frame"] >= 0]

# Sort by frame (good practice)
df = df.sort_values("frame")

# Save aligned file
df.to_csv(output_path, index=False)

print("Cam3 frames shifted back by 200 and saved successfully.")