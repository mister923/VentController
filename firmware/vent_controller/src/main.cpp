#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* websocket_server = "192.168.1.100";  // Your server IP
const int websocket_port = 8080;
const int SERVO_PIN = 13;  // GPIO pin for servo

// Global objects
Servo ventServo;
WebSocketsClient webSocket;
String deviceId;
int currentAngle = 0;

// Function declarations
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void sendDeviceInfo();
void handleCommand(uint8_t * payload, size_t length);

void setup() {
    Serial.begin(115200);
    
    // Initialize servo
    ESP32PWM::allocateTimer(0);
    ventServo.setPeriodHertz(50);
    ventServo.attach(SERVO_PIN);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi");
    
    // Generate unique device ID using MAC address
    deviceId = WiFi.macAddress();
    
    // Initialize WebSocket connection
    webSocket.begin(websocket_server, websocket_port, "/ws");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();
}

// Rest of the functions remain the same as in your original code...
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED:
            sendDeviceInfo();
            break;
        case WStype_TEXT:
            handleCommand(payload, length);
            break;
    }
}

void sendDeviceInfo() {
    StaticJsonDocument<200> doc;
    doc["type"] = "register";
    doc["deviceId"] = deviceId;
    doc["currentAngle"] = currentAngle;
    
    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(output);
}

void handleCommand(uint8_t * payload, size_t length) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        return;
    }
    
    if (doc["type"] == "setAngle") {
        int angle = doc["angle"];
        currentAngle = angle;
        ventServo.write(angle);
        
        // Send confirmation
        StaticJsonDocument<200> response;
        response["type"] = "angleSet";
        response["deviceId"] = deviceId;
        response["angle"] = angle;
        
        String output;
        serializeJson(response, output);
        webSocket.sendTXT(output);
    }
} 