import cv2
import os

# =========================
# CONFIGURATION
# =========================
VIDEO_PATH = "rtsp://admin:Habib_Test@192.168.1.64:554/Streaming/Channels/101/"

# =========================
# LOAD VIDEO
# =========================
cap = cv2.VideoCapture(VIDEO_PATH)
# CRITICAL FOR RTSP: Limits buffer to prevent massive lag over time
cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)

# =========================
# MAIN REAL-TIME LOOP
# =========================
print("🎥 Starting RTSP stream... Press 'q' to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Lost connection to RTSP stream.")
        break
    
    # Display the frame
    cv2.imshow("RTSP Stream", frame)

    # Wait 1ms and check if 'q' is pressed to quit the window
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("🛑 'q' pressed. Shutting down stream...")
        break

# =========================
# CLEANUP
# =========================
cap.release()
cv2.destroyAllWindows()
print("✅ Stream closed")