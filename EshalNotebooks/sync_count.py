import pandas as pd

# Load cam3 count CSV
df = pd.read_csv("csv_files/temp_files_30mins/cam2_people_count_log_door2.csv")

# Synchronization parameters
SCALE = 0.8017
OFFSET = -18

# Align frames
df["Frame"] = (df["Frame"] * SCALE + OFFSET).astype(int)

# Remove negative frames if any
df = df[df["Frame"] >= 0]

# Sort nicely
df = df.sort_values("Frame").reset_index(drop=True)

# Save
df.to_csv("C:/Users/USER/Documents/Git_Final_Year_Project/Git_Final_Year_Project_2026/old_assets/cam2_people_count_log_door2_synced.csv", index=False)

print("Synced cam3 count CSV saved.")