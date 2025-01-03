#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>

// Configuration
const char* ssid = "ORBI53";
const char* password = "Jeppesen531";
//http://192.168.1.24:8081/
const char* websocket_server = "192.168.1.24";
const int websocket_port = 8081;
const int SERVO_PIN = 13;
const char* OTA_HOSTNAME = "VentController";  // OTA hostname
const char* OTA_PASSWORD = "your-ota-password";  // OTA password

// Device configuration
int MIN_ANGLE = 0;
int MAX_ANGLE = 90;
const unsigned long RECONNECT_INTERVAL = 5000;
const unsigned long CONNECTION_TIMEOUT = 10000;

// Global objects
Servo ventServo;
WebSocketsClient webSocket;
String deviceId;
int currentAngle = 0;
unsigned long lastConnectionAttempt = 0;
bool isConnected = false;
unsigned int pongCounter = 0;

// Function declarations
void setupOTA();
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void sendDeviceInfo();
void handleCommand(uint8_t * payload, size_t length);
void ensureConnection();
void logDeviceStatus();

void setup() {
    Serial.begin(115200);
    
    // Initialize servo
    ESP32PWM::allocateTimer(0);
    ventServo.setPeriodHertz(50);
    ventServo.attach(SERVO_PIN);
    ventServo.write(currentAngle);
    Serial.printf("Initial angle set to: %d\n", currentAngle);
    
    // Connect to WiFi
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi");
    
    // Generate unique device ID
    deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    deviceId = deviceId.substring(0, 8);
    
    // Setup OTA
    setupOTA();
    
    // Initialize WebSocket
    webSocket.begin(websocket_server, websocket_port, "/");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(RECONNECT_INTERVAL);
    webSocket.enableHeartbeat(15000, 3000, 2);
}

void setupOTA() {
    // Set hostname for OTA
    ArduinoOTA.setHostname(OTA_HOSTNAME);
    
    // Set password for OTA
    ArduinoOTA.setPassword(OTA_PASSWORD);

    ArduinoOTA.onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH) {
            type = "sketch";
        } else {
            type = "filesystem";
        }
        Serial.println("Start updating " + type);
        
        // Detach servo during update
        ventServo.detach();
    });
    
    ArduinoOTA.onEnd([]() {
        Serial.println("\nEnd");
        // Reattach servo after update
        ventServo.attach(SERVO_PIN);
        ventServo.write(currentAngle);
    });
    
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    });
    
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("End Failed");
        
        // Reattach servo if update fails
        ventServo.attach(SERVO_PIN);
        ventServo.write(currentAngle);
    });
    ArduinoOTA.begin();
    Serial.println("OTA ready");
}

void loop() {
    ArduinoOTA.handle();  // Handle OTA updates
    webSocket.loop();     // Handle WebSocket
    ensureConnection();
}

void ensureConnection() {
    unsigned long currentTime = millis();
    
    // Check WiFi connection first
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected. Reconnecting...");
        WiFi.begin(ssid, password);
        lastConnectionAttempt = currentTime;
        return;
    }
    
    // Then check WebSocket connection
    if (!isConnected && (currentTime - lastConnectionAttempt >= RECONNECT_INTERVAL)) {
        Serial.println("Attempting to reconnect WebSocket...");
        webSocket.disconnect();
        webSocket.begin(websocket_server, websocket_port, "/");
        lastConnectionAttempt = currentTime;
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket Disconnected!");
            isConnected = false;
            break;
            
        case WStype_CONNECTED:
            Serial.println("WebSocket Connected!");
            isConnected = true;
            sendDeviceInfo();  // Register device on connection
            break;
            
        case WStype_TEXT:
            Serial.println("WebSocket Text received:");
            Serial.println((char*)payload);
            handleCommand(payload, length);
            break;
            
        case WStype_ERROR:
            Serial.println("WebSocket Error!");
            isConnected = false;
            break;
            
        case WStype_PING:
            Serial.println("Ping received");
            break;
            
        case WStype_PONG:
            pongCounter++;
            Serial.printf("Pong received (#%u)\n", pongCounter);
            if (pongCounter % 15 == 0) {
                logDeviceStatus();
            }
            break;
            
        default:
            Serial.printf("Unhandled WebSocket event type: %d\n", type);
            break;
    }
}

void sendDeviceInfo() {
    StaticJsonDocument<200> doc;
    doc["type"] = "register";
    doc["deviceType"] = "vent";
    doc["deviceId"] = deviceId;
    doc["currentAngle"] = currentAngle;
    
    JsonObject config = doc.createNestedObject("config");
    config["minAngle"] = MIN_ANGLE;
    config["maxAngle"] = MAX_ANGLE;
    
    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(output);
    Serial.println("Sent registration: " + output);
}

void handleCommand(uint8_t * payload, size_t length) {
    Serial.println("Parsing command...");
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        Serial.println("JSON parsing failed!");
        return;
    }
    
    const char* type = doc["type"];
    Serial.printf("Command type: %s\n", type);
    
    if (strcmp(type, "angleSet") == 0) {
        int angle = doc["angle"];
        Serial.printf("Received command: %s {angle: %d}\n", type, angle);
        
        if (angle >= MIN_ANGLE && angle <= MAX_ANGLE) {
            Serial.printf("Changing angle from %d to %d\n", currentAngle, angle);
            int pulseWidth = map(angle, 0, 180, 500, 2400);  // Calculate approximate pulse width
            Serial.printf("Approximate pulse width: %d microseconds\n", pulseWidth);
            currentAngle = angle;
            ventServo.write(angle);
            
            // Send confirmation in same format as simulator
            StaticJsonDocument<200> response;
            response["type"] = "angleSet";
            response["deviceId"] = deviceId;
            response["angle"] = currentAngle;
            
            String output;
            serializeJson(response, output);
            webSocket.sendTXT(output);
            Serial.printf("Angle set to: %d\n", angle);
        } else {
            Serial.printf("Requested angle %d out of range (%d-%d)\n", 
                angle, MIN_ANGLE, MAX_ANGLE);
        }
    }
}

void logDeviceStatus() {
    Serial.println("\n=== Device Status ===");
    Serial.printf("Device ID: %s\n", deviceId.c_str());
    Serial.printf("Device Type: vent\n");
    Serial.printf("WiFi SSID: %s\n", WiFi.SSID().c_str());
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Current Angle: %d\n", currentAngle);
    Serial.printf("WebSocket Connected: %s\n", isConnected ? "Yes" : "No");
    Serial.println("==================\n");
} 