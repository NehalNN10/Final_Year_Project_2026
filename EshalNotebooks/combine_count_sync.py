import pandas as pd
from collections import defaultdict

# File paths
csv1_path = "csv_files/temp_files_30mins/cam1_people_count_log_1hr.csv"
csv2_path = "csv_files/temp_files_30mins/cam2_people_count_log_door1.csv"
csv3_path = "csv_files/temp_files_30mins/cam2_people_count_log_door2.csv"
output_path = "csv_files/temp_files_30mins/combined_count_sync.csv"

# Initial occupancy
global_count = 18

# Delay for cam1 and cam2
FRAME_DELAY = 200

# Read CSVs
df1 = pd.read_csv(csv1_path)
df2 = pd.read_csv(csv2_path)
df3 = pd.read_csv(csv3_path)

# Dictionary:
# frame -> total change applied at that frame
frame_changes = defaultdict(int)

# ---------------------------------------------------
# csv1 changes apply 200 frames later
# ---------------------------------------------------
for _, row in df1.iterrows():
    original_frame = int(row["Frame"])
    count_change = int(row["Count"])

    applied_frame = original_frame + FRAME_DELAY
    frame_changes[applied_frame] += count_change

# ---------------------------------------------------
# csv2 changes apply 200 frames later
# ---------------------------------------------------
for _, row in df2.iterrows():
    original_frame = int(row["Frame"])
    count_change = int(row["Count"])

    applied_frame = original_frame + FRAME_DELAY
    frame_changes[applied_frame] += count_change

# ---------------------------------------------------
# csv3 applies immediately
# ---------------------------------------------------
for _, row in df3.iterrows():
    frame = int(row["Frame"])
    count_change = int(row["Count"])

    frame_changes[frame] += count_change

# ---------------------------------------------------
# Create full frame timeline starting at 0
# ---------------------------------------------------
max_frame = max(frame_changes.keys())

frames = []
counts = []

current_count = global_count

for frame in range(max_frame + 1):

    # Apply changes scheduled for THIS frame
    current_count += frame_changes[frame]

    frames.append(frame)
    counts.append(current_count)

# ---------------------------------------------------
# Save output
# ---------------------------------------------------
output_df = pd.DataFrame({
    "Frame": frames,
    "Count": counts
})

output_df.to_csv(output_path, index=False)

print("Final CSV saved as:", output_path)