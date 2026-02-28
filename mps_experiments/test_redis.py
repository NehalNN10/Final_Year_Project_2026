import redis
import json

# Connect to your EC2 instance
print("Connecting to EC2 Redis...")
redis_client = redis.Redis(host='3.109.201.41', port=6379, decode_responses=True)

# Subscribe to the channel
pubsub = redis_client.pubsub()
pubsub.subscribe('tracking_stream')

print("🎧 Successfully subscribed! Waiting for coordinate data from the tracking script...")

# Listen forever
for message in pubsub.listen():
    if message['type'] == 'message':
        # Parse the JSON payload
        data = json.loads(message['data'])
        print(f"📥 RECEIVED: {data}")