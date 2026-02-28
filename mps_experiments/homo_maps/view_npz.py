import numpy as np

# Load the file
# allow_pickle is sometimes needed depending on how numpy saved the data
data = np.load('cam3_calib.npz', allow_pickle=True)

# data.files gives you a list of all the keys (variable names) saved in the file
print(f"Items found in npz file: {len(data.files)}\n")

# Loop through all the saved items and print them
for key in data.files:
    print(f"--- {key} ---")
    
    # Access the actual array using the key like a dictionary
    array_content = data[key]
    
    print(f"Shape: {array_content.shape}")
    print(array_content)
    print("\n")

# It is good practice to close the file to free up memory
data.close()