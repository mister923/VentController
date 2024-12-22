VentController
=============

A ventilation control system application for controlling smart air vents.

Project Structure:
----------------
project/
├── webapp/         # Frontend React application
├── server/         # WebSocket server for device communication
├── firmware/       # ESP32 firmware for physical vent devices
└── tools/         # Development tools and simulators

Component Details:
---------------
1. Frontend (webapp/)
   - React-based web interface
   - Real-time vent control
   - Floor plan visualization
   - Device management interface
   - Dependencies: React, Konva, TailwindCSS

2. Backend (server/)
   - WebSocket server
   - Handles device connections
   - Manages device state
   - Dependencies: ws (WebSocket library)

3. Firmware (firmware/vent_controller/)
   - ESP32-based controller code
   - Servo motor control
   - WiFi connectivity
   - WebSocket client
   - Dependencies: Arduino framework, ESP32Servo, WebSocketsClient, ArduinoJson

4. Tools (tools/)
   - Device simulator for testing
   - Simulates multiple virtual vent devices
   - Useful for development without physical hardware

Setup:
-----
Prerequisites:
- Node.js (for webapp and server)
- Python 3.7+ (for simulator)
- PlatformIO (for firmware)
- websockets library (pip install websockets)

Installation:
1. Clone the repository:
   git clone https://github.com/mister923/VentController.git
   cd VentController

2. Install frontend dependencies:
   cd webapp
   npm install

3. Install backend dependencies:
   cd server
   npm install

4. Set up firmware (using PlatformIO):
   - Open firmware/vent_controller in PlatformIO
   - Configure WiFi credentials in main.cpp
   - Flash to ESP32 device

Development Tools:
================

Vent Device Simulator:
--------------------
Location: tools/simulator.py

Basic Usage:
-----------
# Simulate 1 device (default)
python tools/simulator.py

# Simulate multiple devices
python tools/simulator.py --devices 3

# Connect to a different server
python tools/simulator.py --server ws://example.com:8081 --devices 2

Command Line Arguments:
---------------------
--devices : Number of virtual vent devices to simulate (default: 1)
--server  : WebSocket server URI (default: ws://localhost:8081)

Running the Application:
---------------------
1. Start the WebSocket server:
   cd server
   npm start

2. Start the frontend:
   cd webapp
   npm start

3. (Optional) Start the simulator:
   python tools/simulator.py --devices 3

Contributing:
-----------
1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

License:
-------
[Add your license information]