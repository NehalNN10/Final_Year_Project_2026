#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Make sure you installed this library!

// --- HARDWARE PINS ---
#define LDRPIN 4
#define DHTPIN 21
#define SWITCHPIN 19
#define DHTTYPE DHT22

// --- WIFI & SERVER SETTINGS ---
const char* ssid = "Not your wifi";
const char* password = "tjnc7740";
// Put your Mac's IP address here, keeping the http:// and :5000/sensor-data
const char* serverName = "http://10.240.174.51:1767/sensor-data"; 

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(SWITCHPIN, INPUT_PULLUP);

  // 1. Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1. Read Sensors
  int ldrVal = analogRead(LDRPIN);
  int switchState = digitalRead(SWITCHPIN);
  float tempC = dht.readTemperature();
  float humidity = dht.readHumidity();

  // If DHT fails, print error and skip this loop iteration
  if (isnan(tempC) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }

  // 2. Format data into a JSON object
  // (JsonDocument is the standard for ArduinoJson v7)
  JsonDocument doc; 
  doc["device_id"] = "lab_station_1";
  doc["temperature"] = tempC;
  doc["humidity"] = humidity;
  doc["ldr"] = ldrVal;
  doc["switch_state"] = (switchState == LOW) ? "ON" : "OFF";

  // Serialize the JSON object into a normal string
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // 3. Send the HTTP POST Request (Only if WiFi is connected)
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    Serial.println("Sending data to Flask...");
    http.begin(serverName); // Specify destination
    http.addHeader("Content-Type", "application/json"); // Tell Flask to expect JSON

    // Send the actual POST request
    int httpResponseCode = http.POST(jsonPayload);

    // Print the response from the server
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      // Optional: Print the server's reply (e.g., {"status": "success"})
      // String response = http.getString(); 
      // Serial.println(response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end(); // Free up resources
  } else {
    Serial.println("WiFi Disconnected. Cannot send data.");
  }

  // Wait 5 seconds before sending the next reading
  delay(5000); 
}