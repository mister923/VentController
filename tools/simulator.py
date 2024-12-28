from dataclasses import dataclass
from typing import Dict, Optional, Literal
import asyncio
import websockets
import json
import uuid
import argparse
import random

@dataclass
class BaseDevice:
    device_id: str
    device_type: Literal["vent", "sensor"]
    websocket: Optional[websockets.WebSocketClientProtocol] = None

    async def connect(self, uri: str):
        self.websocket = await websockets.connect(uri)
        await self.register()

@dataclass
class VentDevice(BaseDevice):
    current_angle: int = 0
    min_angle: int = 0
    max_angle: int = 90
    device_type: Literal["vent"] = "vent"

    async def register(self):
        message = {
            "type": "register",
            "deviceType": self.device_type,
            "deviceId": self.device_id,
            "currentAngle": self.current_angle,
            "config": {
                "minAngle": self.min_angle,
                "maxAngle": self.max_angle
            }
        }
        await self.websocket.send(json.dumps(message))
        print(f"Vent {self.device_id} registered")

    async def handle_messages(self):
        try:
            while True:
                message = await self.websocket.recv()
                data = json.loads(message)
                print(f"\nVent {self.device_id} received: {data}")
                
                if data["type"] == "setAngle":
                    angle = data["angle"]
                    if self.min_angle <= angle <= self.max_angle:
                        self.current_angle = angle
                        response = {
                            "type": "angleSet",
                            "deviceId": self.device_id,
                            "angle": self.current_angle
                        }
                        await self.websocket.send(json.dumps(response))
                        print(f"Vent {self.device_id} angle set to {angle}")
                    else:
                        print(f"Vent {self.device_id}: Angle {angle} out of range")
        except websockets.exceptions.ConnectionClosed:
            print(f"Vent {self.device_id} disconnected")

@dataclass
class SensorDevice(BaseDevice):
    current_temp: float = 20.0
    device_type: Literal["sensor"] = "sensor"

    async def register(self):
        message = {
            "type": "register",
            "deviceType": self.device_type,
            "deviceId": self.device_id,
            "currentTemp": self.current_temp
        }
        await self.websocket.send(json.dumps(message))
        print(f"Sensor {self.device_id} registered")

    async def handle_messages(self):
        try:
            while True:
                await asyncio.sleep(5)  # Send temperature update every 5 seconds
                self.current_temp += random.uniform(-2, 2)  # Simulate temperature changes
                message = {
                    "type": "tempUpdate",
                    "deviceId": self.device_id,
                    "temperature": round(self.current_temp, 1)
                }
                await self.websocket.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            print(f"Sensor {self.device_id} disconnected")

class DeviceSimulator:
    def __init__(self, server_uri: str, num_vents: int, num_sensors: int):
        self.server_uri = server_uri
        self.num_vents = num_vents
        self.num_sensors = num_sensors
        self.devices: Dict[str, BaseDevice] = {}

    async def start(self):
        print(f"Starting simulator with {self.num_vents} vents and {self.num_sensors} sensors")
        
        # Create vent devices
        for _ in range(self.num_vents):
            device_id = str(uuid.uuid4())[:8]
            device = VentDevice(device_id=device_id)
            self.devices[device_id] = device
            
            await device.connect(self.server_uri)
            asyncio.create_task(device.handle_messages())

        # Create sensor devices
        for _ in range(self.num_sensors):
            device_id = str(uuid.uuid4())[:8]
            device = SensorDevice(device_id=device_id)
            self.devices[device_id] = device
            
            await device.connect(self.server_uri)
            asyncio.create_task(device.handle_messages())

        print("\nAll devices connected. Press Ctrl+C to exit.")
        try:
            await asyncio.Future()  # run forever
        except KeyboardInterrupt:
            print("\nShutting down devices...")
            for device in self.devices.values():
                await device.websocket.close()

def main():
    parser = argparse.ArgumentParser(description='Device Simulator')
    parser.add_argument('--vents', type=int, default=1, help='Number of vent devices to simulate')
    parser.add_argument('--sensors', type=int, default=1, help='Number of sensor devices to simulate')
    parser.add_argument('--server', type=str, default='ws://localhost:8081', help='WebSocket server URI')
    args = parser.parse_args()

    simulator = DeviceSimulator(args.server, args.vents, args.sensors)
    asyncio.run(simulator.start())

if __name__ == "__main__":
    main()
