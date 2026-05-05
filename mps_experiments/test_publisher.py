# test_publisher.py (Run this on your Mac)
import redis
import json
import time

# Use the IP address from your app.py
EC2_REDIS_IP = '13.204.143.167'

print(f"Connecting to Redis at {EC2_REDIS_IP}...")
try:
    # Connect to AWS Redis
    r = redis.Redis(host=EC2_REDIS_IP, port=6379, decode_responses=True)
    r.ping()
    print("✅ Successfully connected to AWS Redis!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# Simulate sending a detection frame
test_data = {
    "id": 1,
    "x": 15.5,
    "z": -4.2,
    "frame": 100,
    "timestamp": time.time(),
    "occupancy": 3,
    "region": "Projects Lab"
}

print("Sending data to channel 'tracking_stream'...")
# Publish the JSON data to the channel your app.py will eventually listen to
r.publish('tracking_stream', json.dumps(test_data))
print("✅ Data sent successfully!")