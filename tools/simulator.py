import asyncio
import websockets
import json
import uuid
import argparse
from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class VentDevice:
    device_id: str
    current_angle: int = 0
    min_angle: int = 0
    max_angle: int = 90
    websocket: Optional[websockets.WebSocketClientProtocol] = None

    async def connect(self, uri: str):
        self.websocket = await websockets.connect(uri)
        await self.register()
        
    async def register(self):
        message = {
            "type": "register",
            "deviceId": self.device_id,
            "currentAngle": self.current_angle,
            "config": {
                "minAngle": self.min_angle,
                "maxAngle": self.max_angle
            }
        }
        await self.websocket.send(json.dumps(message))
        print(f"Device {self.device_id} registered")

    async def handle_messages(self):
        try:
            while True:
                message = await self.websocket.recv()
                data = json.loads(message)
                print(f"\nDevice {self.device_id} received: {data}")
                
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
                        print(f"Device {self.device_id} angle set to {angle}")
                    else:
                        print(f"Device {self.device_id}: Angle {angle} out of range")
        except websockets.exceptions.ConnectionClosed:
            print(f"Device {self.device_id} disconnected")

class DeviceSimulator:
    def __init__(self, server_uri: str, num_devices: int):
        self.server_uri = server_uri
        self.num_devices = num_devices
        self.devices: Dict[str, VentDevice] = {}

    async def start(self):
        print(f"Starting simulator with {self.num_devices} devices")
        for _ in range(self.num_devices):
            device_id = str(uuid.uuid4())[:8]
            device = VentDevice(device_id)
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
    parser = argparse.ArgumentParser(description='Vent Device Simulator')
    parser.add_argument('--devices', type=int, default=1, help='Number of devices to simulate')
    parser.add_argument('--server', type=str, default='ws://localhost:8081', help='WebSocket server URI')
    args = parser.parse_args()

    simulator = DeviceSimulator(args.server, args.devices)
    asyncio.run(simulator.start())

if __name__ == "__main__":
    main()
