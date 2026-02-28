# main.py
import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mongoengine import connect
from dotenv import load_dotenv

# Import your existing models
from models import Rooms, RoomData 

load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Allow Next.js (port 3000) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
mongo_uri = os.getenv("MONGODB_URI")
connect(host=mongo_uri)

# --- YOUR API ROUTES ---

@app.get("/api/facilities")
def get_facilities():
    # 1. Fetch data using your existing MongoEngine models
    rooms = Rooms.objects()
    
    # 2. Format it
    room_list = []
    for room in rooms:
        room_list.append({
            "id": room.room_id,
            "name": room.room_name,
            "occupancy": "Occupied", 
            "temperature": "23°C",   
            "ac": "On",              
            "lights": "On"           
        })
        
    # FastAPI automatically converts dictionaries to JSON! No jsonify() needed.
    return {"status": "success", "rooms": room_list}

@app.get("/api/model-data")
def get_model_data():
    raw_data = RoomData.objects.as_pymongo()
    
    clean_data = []
    for d in raw_data:
        clean_data.append({
            "time": d['time'],
            "occupancy": d['occupancy'],
            "temp": d['temperature'],       
            "ac": "On" if d['ac'] else "Off",           
            "lights": "On" if d['lights'] else "Off"    
        })

    return {"data": clean_data}