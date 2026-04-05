import pandas as pd

# Load CSV files
df1 = pd.read_csv("csv_files/temp_files_30mins/interpolated_ang_1.csv")
df2 = pd.read_csv("csv_files/temp_files_30mins/interpolated_ang_2.csv")
df3 = pd.read_csv("csv_files/temp_files_30mins/interpolated_ang_3.csv")
df4 = pd.read_csv("csv_files/temp_files_30mins/interpolated_ang_DIL.csv")

# Add camera/angle identifier
df1["camera"] = "cam1"
df2["camera"] = "cam2"
df3["camera"] = "cam3"
df4["camera"] = "cam4"

# Combine all rows
combined = pd.concat([df1, df2, df3, df4], ignore_index=True)

# Sort by frame (and optionally by camera for consistency)
combined = combined.sort_values(by=["frame", "camera"]).reset_index(drop=True)

# Save
combined.to_csv(
    "csv_files/temp_files_30mins/combined_tracks.csv", index=False)