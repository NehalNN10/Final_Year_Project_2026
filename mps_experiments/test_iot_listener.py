import redis
import json

r = redis.Redis(host='13.204.143.167', port=6379, decode_responses=True)
pubsub = r.pubsub()

# Listen specifically to the IoT channel
# pubsub.subscribe('iot_stream')
pubsub.subscribe('live_detections')

print("🎧 Listening to EC2 Redis for IoT data... (Press Ctrl+C to stop)")

for message in pubsub.listen():
    if message['type'] == 'message':
        print("\n🌡️ NEW IOT SENSOR DATA:")
        try:
            print(json.dumps(json.loads(message['data']), indent=2))
        except:
            print(message['data'])