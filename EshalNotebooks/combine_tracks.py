import pandas as pd

# Load CSV files
df1 = pd.read_csv("file1.csv")
df2 = pd.read_csv("file2.csv")
df3 = pd.read_csv("file3.csv")

# Combine all rows
combined_df = pd.concat([df1, df2, df3], ignore_index=True)

# Sort by frame number
combined_df = combined_df.sort_values(by="frame")

# Save output
combined_df.to_csv("combined_sorted.csv", index=False)