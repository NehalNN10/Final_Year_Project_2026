import pandas as pd

# Load the two Excel files
file1 = pd.read_excel("C:/Users/USER/Downloads/cam1_people_count_log.xlsx")
file2 = pd.read_excel("C:/Users/USER/Downloads/cam2_people_count_log.xlsx")

# Merge on 'frame' column (outer keeps all frames from both files)
merged = pd.merge(file1, file2, on="Frame", how="outer", suffixes=('_1', '_2'))

# Replace NaN values with 0 (in case a frame exists in only one file)
merged = merged.fillna(0)

# Add the counts
merged["count"] = merged["Count_1"] + merged["Count_2"]

# Keep only required columns
final_df = merged[["Frame", "count"]]

# Sort by frame number (optional but recommended)
final_df = final_df.sort_values(by="Frame")

# Save to new Excel file
final_df.to_excel("C:/Users/USER/Downloads/combined_count_output.xlsx", index=False)

print("Combined file saved as combined_output.xlsx")

import pandas as pd

# Load the two Excel files
file1 = pd.read_excel("C:/Users/USER/Downloads/cam1_people_count_log.xlsx")
file2 = pd.read_excel("C:/Users/USER/Downloads/cam2_people_count_log.xlsx")

# Merge on 'frame' column (outer keeps all frames from both files)
merged = pd.merge(file1, file2, on="Frame", how="outer", suffixes=('_1', '_2'))

# Replace NaN values with 0 (in case a frame exists in only one file)
merged = merged.fillna(0)

# Add the counts
merged["count"] = merged["Count_1"] + merged["Count_2"]

# Keep only required columns
final_df = merged[["Frame", "count"]]

# Sort by frame number (optional but recommended)
final_df = final_df.sort_values(by="Frame")

# Save to new Excel file
final_df.to_excel("C:/Users/USER/Downloads/combined_count_output.xlsx", index=False)

print("Combined file saved as combined_output.xlsx")
