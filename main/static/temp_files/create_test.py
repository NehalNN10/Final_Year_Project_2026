import pandas as pd

# Load your existing Power Lab CSV
df = pd.read_csv('./main/static/temp_files/combined_proj_data_15min.csv')

# Force the first 1800 rows to have 0 occupancy and AC 'On'
# Note: You might need to duplicate the 900-row file to get 1800 rows (30 mins)
test_df = pd.concat([df, df]) # This makes it 1800 rows (30 mins)
test_df['ac'] = 'On'
test_df['occupancy'] = 0 # Ensure this column exists or match your seed.py logic

test_df.to_csv('./main/static/temp_files/test_energy_waste.csv', index=False)
print("Created test_energy_waste.csv with 30 mins of waste data.")