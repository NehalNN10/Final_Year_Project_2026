import pandas as pd

# File paths
csv1_path = "csv_files/temp_files_30mins/cam1_people_count_log_1hr.csv"
csv2_path = "csv_files/temp_files_30mins/cam2_people_count_log_door1.csv"
csv3_path = "csv_files/temp_files_30mins/cam2_people_count_log_door2.csv"
output_path = "csv_files/temp_files_30mins/combined_count.csv"

# Initial global count 19
global_count = 18

# Read CSV files
df1 = pd.read_csv(csv1_path)
df2 = pd.read_csv(csv2_path)
df3 = pd.read_csv(csv3_path)

# Rename count columns before merging (cleaner)
df1 = df1.rename(columns={"Count": "Count_1"})
df2 = df2.rename(columns={"Count": "Count_2"})
df3 = df3.rename(columns={"Count": "Count_3"})

# Merge step-by-step
merged = pd.merge(df1, df2, on="Frame", how="outer")
merged = pd.merge(merged, df3, on="Frame", how="outer")

# Fill missing values
merged = merged.fillna(0)

# Sum change in count from all CSVs
merged["total_change"] = merged["Count_1"] + merged["Count_2"] + merged["Count_3"]

# Sort by frame
merged = merged.sort_values("Frame")

# Compute running global count
final_counts = []
for change in merged["total_change"]:
    global_count += change
    final_counts.append(global_count)

# Final dataframe
output_df = pd.DataFrame({
    "Frame": merged["Frame"],
    "Count": final_counts
})

# Save CSV
output_df.to_csv(output_path, index=False)

print("Final CSV saved as:", output_path)