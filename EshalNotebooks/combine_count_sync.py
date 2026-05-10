import pandas as pd

# File paths
csv1_path = "csv_files/temp_files_30mins/cam1_people_count_log_1hr.csv"
csv2_path = "csv_files/temp_files_30mins/cam2_people_count_log_door1.csv"
csv3_path = "csv_files/temp_files_30mins/cam2_people_count_log_door2.csv"
output_path = "csv_files/temp_files_30mins/combined_count_sync.csv"

# Initial global count
global_count = 18

# Delay for cam1 + cam2
FRAME_DELAY = 200

# Read CSV files
df1 = pd.read_csv(csv1_path)
df2 = pd.read_csv(csv2_path)
df3 = pd.read_csv(csv3_path)

# ---------------------------------------------------
# Shift Frame for csv1 and csv2 by +200 frames
# ---------------------------------------------------
df1["Frame"] = df1["Frame"] + FRAME_DELAY
df2["Frame"] = df2["Frame"] + FRAME_DELAY

# Rename columns
df1 = df1.rename(columns={"Count": "Count_1"})
df2 = df2.rename(columns={"Count": "Count_2"})
df3 = df3.rename(columns={"Count": "Count_3"})

# ---------------------------------------------------
# Merge all CSVs
# ---------------------------------------------------
merged = pd.merge(df1, df2, on="Frame", how="outer")
merged = pd.merge(merged, df3, on="Frame", how="outer")

# Replace NaN with 0
merged = merged.fillna(0)

# Sort by frame
merged = merged.sort_values("Frame")

# ---------------------------------------------------
# Total count change per frame
# ---------------------------------------------------
merged["total_change"] = (
    merged["Count_1"] +
    merged["Count_2"] +
    merged["Count_3"]
)

# ---------------------------------------------------
# Running occupancy count
# ---------------------------------------------------
final_counts = []

for change in merged["total_change"]:
    global_count += change
    final_counts.append(global_count)

# ---------------------------------------------------
# Final output
# ---------------------------------------------------
output_df = pd.DataFrame({
    "Frame": merged["Frame"].astype(int),
    "Count": final_counts
})

# Save CSV
output_df.to_csv(output_path, index=False)

print("Final CSV saved as:", output_path)