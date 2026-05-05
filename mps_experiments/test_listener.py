# test_listener.py (Run this on your Mac in a separate terminal)
import redis

EC2_REDIS_IP = '13.204.143.167'

r = redis.Redis(host=EC2_REDIS_IP, port=6379, decode_responses=True)
pubsub = r.pubsub()

# Subscribe to the same channel
pubsub.subscribe('tracking_stream')

print("🎧 Listening to AWS Redis for incoming data... (Press Ctrl+C to stop)")

for message in pubsub.listen():
    if message['type'] == 'message':
        print("\n📨 RECEIVED DATA FROM AWS:")
        print(message['data'])