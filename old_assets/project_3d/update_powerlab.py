import pandas as pd
from models import db, RoomData, Rooms
from flask import Flask
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config['MONGODB_SETTINGS'] = {'host': os.getenv("MONGODB_URI")}
db.init_app(app)

def update_specific_records():
    with app.app_context():
        room = Rooms.objects(room_id="C-007").first()
        if not room:
            print("Room C-007 not found.")
            return

        # 2. Load your CSVs
        df_ac = pd.read_csv('main/static/temp_files/test_energy_waste.csv')
        # df_occ = pd.read_csv('dilab_counts_fixed.csv')

        print(f"Updating {len(df_ac)} records for C-007...")

        for i in range(len(df_ac)):
            # Define the unique identifier for this specific data point
            timestamp = str(df_ac.iloc[i]['timestamp'])
            print(f"Room C-007 at {timestamp}")
            
            # Perform an 'upsert': find by room and time, then update fields
            RoomData.objects(room=room, time=timestamp).update_one(
                set__occupancy=int(df_ac.iloc[i]['occupancy']),
                set__ac=bool(df_ac.iloc[i]['ac']=='On'),
                set__lights=bool(df_ac.iloc[i]['lights']=='On'),
                set__temperature=float(df_ac.iloc[i]['temp']),
                upsert=True
            )

        print("✅ Update complete. Only C-007 records were affected.")

if __name__ == "__main__":
    update_specific_records()
# from app import check_energy_waste_automated
# check_energy_waste_automated("C-007")