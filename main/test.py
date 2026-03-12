import pandas as pd

data_proj = pd.read_csv('../csv_files/temp_files_15min/cs_lab_iot_15min.csv')
occu_proj = pd.read_csv('../csv_files/temp_files_15min/combined_count_15min.csv')

occu_subset = occu_proj.iloc[::25].reset_index(drop=True)
data_proj['occu'] = occu_subset['Count']

data_proj.to_csv('../csv_files/temp_files_15min/combined_proj_data_15min.csv', index=False)