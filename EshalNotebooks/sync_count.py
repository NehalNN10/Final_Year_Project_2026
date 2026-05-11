import pandas as pd

# Load count CSV
df = pd.read_csv("csv_files/active_files/dilab_counts_fixed.csv")

# Sync parameters
SCALE = 0.8017
OFFSET = -18

# Synchronize frames
df["Frame"] = (df["Frame"] * SCALE + OFFSET).round().astype(int)

# Remove invalid frames
df = df[df["Frame"] >= 0]

# Merge duplicate frames
df = (
    df.groupby("Frame", as_index=False)
      .agg({
          "Count": "max"   # change if needed
      })
)

# Sort
df = df.sort_values("Frame").reset_index(drop=True)

# Save
df.to_csv(
    "csv_files/active_files/dilab_counts_synced.csv",
    index=False
)

print("Synced cam4 count CSV saved.")