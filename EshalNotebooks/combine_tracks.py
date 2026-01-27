import pandas as pd

# Load CSV files
df1 = pd.read_csv("C:/Users/USER/Documents/Final_Year_Project_2026/3js_practice/projects_lab_2d/files/tracks_output.csv")
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
combined.to_csv("C:/Users/USER/Documents/Final_Year_Project_2026/3js_practice/projects_lab_2d/files/combined_frames.csv", index=False)

# # Input CSV files
# files = [
#     "C:/Users/USER/Downloads/fyp outputs/tracks_output_cam1_allframes.csv",
#     "C:/Users/USER/Downloads/fyp outputs/tracks_output_cam2_allframes.csv",
#     "C:/Users/USER/Downloads/fyp outputs/clamped_tracks_manal_angle3.csv"
# ]

# dfs = []
# for src_id, path in enumerate(files):
#     df = pd.read_csv(path)

#     # REQUIRED columns
#     df["frame"] = df["frame"].astype(int)
#     df["track_id"] = df["track_id"].astype(int)

#     # Prevent ID collisions across files
#     df["global_id"] = src_id * 1_000_000 + df["track_id"]

#     dfs.append(df)

# # Combine all CSVs
# df = pd.concat(dfs, ignore_index=True)

# # Flicker-proof stable ordering
# sort_cols = ["frame", "global_id"]

# # Add point_id if it exists
# if "point_id" in df.columns:
#     sort_cols.append("point_id")

# df = df.sort_values(
#     by=sort_cols,
#     kind="stable"
# ).reset_index(drop=True)

# # Write output
# df.to_csv("C:/Users/USER/Documents/Final_Year_Project_2026/3js_practice/projects_lab_2d/files/combined_flicker_free.csv", index=False)
# # "C:\Users\USER\Documents\Final_Year_Project_2026\3js_practice\projects_lab_2d\files\combined_flicker_free.csv"