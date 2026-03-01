import pandas as pd

# File paths
csv1_path = "3js_practice/projects_lab_2d/trim_files/cam1_trimmed_count.csv"
csv2_path = "3js_practice/projects_lab_2d/trim_files/cam2_trimmed_count.csv"
output_path ="3js_practice/projects_lab_2d/trim_files/combined_trimmed_count.csv"

# Initial global count
global_count = 19

# Read CSV files
df1 = pd.read_csv(csv1_path)
df2 = pd.read_csv(csv2_path)

# Merge on frame and sum counts
merged = pd.merge(df1, df2, on="Frame", how="outer", suffixes=('_1', '_2')).fillna(0)

# Sum change in count from both CSVs
merged["total_change"] = merged["Count_1"] + merged["Count_2"]

# Sort by frame (important)
merged = merged.sort_values("Frame")

# Create list to store results
final_counts = []

# Compute running global count
for change in merged["total_change"]:
    global_count += change
    final_counts.append(global_count)

# Prepare final dataframe
output_df = pd.DataFrame({
    "Frame": merged["Frame"],
    "Count": final_counts
})

# Save to CSV
output_df.to_csv(output_path, index=False)

print("Final CSV saved as:", output_path)