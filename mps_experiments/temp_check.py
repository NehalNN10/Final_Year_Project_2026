import cv2

# Use 102 for the sub-stream to save on bandwidth during testing
url = "rtsp://admin:Habib_Test@192.168.1.64:554/Streaming/Channels/101/"

cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("Cannot open RTSP stream. Check credentials or stream path.")
else:
    print("Success! Stream is open.")
    ret, frame = cap.read()
    if ret:
        cv2.imshow('Hikvision Test', frame)
        cv2.waitKey(0)

cap.release()
cv2.destroyAllWindows()