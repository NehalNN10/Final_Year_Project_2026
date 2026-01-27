import pandas as pd

# Load CSV files
df1 = pd.read_csv("C:/Users/USER/Documents/Final_Year_Project_2026/3js_practice/projects_lab_2d/temp_files/tracks_output.csv")
df2 = pd.read_csv("C:/Users/USER/Downloads/fyp outputs/tracks_output_cam2_allframes.csv")
df3 = pd.read_csv("C:/Users/USER/Downloads/fyp outputs/clamped_tracks_manal_angle3.csv")


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