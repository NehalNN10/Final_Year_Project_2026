#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
//flask server endpoint, just enter your laptop IP. neechy wali placeholder hai dafa maaro
const char* serverURL = "http://192.168.1.10:1767/data"; 

#define DHTPIN 4   //dht sensor pin to be mounted on esp32
#define DHTTYPE DHT22 //dht ki type dekhni hogi, mostly its 22, otherwise 11.

DHT dht(DHTPIN, DHTTYPE);

//Lidar sensor abhi hai nahi toh commented
// int lidarPin = 34;
// float lidarLightValue = 0;

void setup() {

  Serial.begin(115200);

  dht.begin();

  // pinMode(lidarPin, INPUT); 

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Connected to WiFi");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    float temperature = dht.readTemperature();

    if (isnan(temperature)) {
      Serial.println("Failed to read DHT22");
      return;
    }

    // lidarLightValue = analogRead(lidarPin);

    // -------- CREATE JSON --------
    StaticJsonDocument<200> doc;

    doc["temperature"] = temperature;

    // doc["lidar_light"] = lidarLightValue;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println("Sending JSON:");
    Serial.println(jsonString);

    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonString);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();
  }

  delay(5000);  // send every 5 seconds
}