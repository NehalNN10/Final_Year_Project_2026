
import pandas as pd
import numpy as np

INPUT_CSV = "3js_practice/projects_lab_2d/temp_files_hour/test.csv"
OUTPUT_CSV = "3js_practice/projects_lab_2d/temp_files_hour/test_2.csv"
MAX_FRAME = 22566
# =========================

# Load
df = pd.read_csv(INPUT_CSV)

# Keep only frames up to limit
df = df[df["frame"] <= MAX_FRAME]

df = df.sort_values(["track_id", "frame"])

filled_rows = []

numeric_cols = [
    "x1","y1","x2","y2",
    "score",
    "feet_x","feet_y",
    "three_x","three_z"
]

for pid, group in df.groupby("track_id"):

    group = group.sort_values("frame").reset_index(drop=True)

    for i in range(len(group) - 1):

        curr = group.iloc[i]
        nxt = group.iloc[i + 1]

        f1 = int(curr["frame"])
        f2 = int(nxt["frame"])
        

        # Always keep current detection
        filled_rows.append(curr)

        gap = f2 - f1
        print(gap)
        if gap > 1:  # ID disappeared in between

            for missing_frame in range(f1 + 1, min(f2, MAX_FRAME + 1)):

                alpha = (missing_frame - f1) / (f2 - f1)

                new_row = {
                    "frame": missing_frame,
                    "track_id": curr["track_id"],
                    "cls": curr["cls"]
                }

                for col in numeric_cols:
                    v1 = curr[col]
                    v2 = nxt[col]
                    new_row[col] = v1 + alpha * (v2 - v1)

                filled_rows.append(pd.Series(new_row))

    # Add last real detection
    if group.iloc[-1]["frame"] <= MAX_FRAME:
        filled_rows.append(group.iloc[-1])

# Create dataframe
result_df = pd.DataFrame(filled_rows)

# Final cleanup
result_df = result_df[result_df["frame"] <= MAX_FRAME]
result_df = result_df.sort_values(["frame", "track_id"])

result_df.to_csv(OUTPUT_CSV, index=False)

print("Gap interpolation complete.")
print("Saved to:", OUTPUT_CSV)