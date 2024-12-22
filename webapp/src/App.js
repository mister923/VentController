import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';

function App() {
  const [devices, setDevices] = useState({});
  const [floorPlan, setFloorPlan] = useState(null);
  const [vents, setVents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'register':
          setDevices(prev => ({
            ...prev,
            [data.deviceId]: { angle: data.currentAngle }
          }));
          break;
          
        case 'angleSet':
          setDevices(prev => ({
            ...prev,
            [data.deviceId]: { ...prev[data.deviceId], angle: data.angle }
          }));
          break;
      }
    };

    return () => {
      wsRef.current.close();
    };
  }, []);

  const handleFloorPlanUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new window.Image();
    img.onload = () => {
      setFloorPlan(img);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleStageClick = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const deviceId = document.getElementById('deviceSelect').value;
    
    if (deviceId) {
      setVents(prev => [...prev, {
        x: pos.x,
        y: pos.y,
        deviceId
      }]);
    }
  };

  const setVentAngle = (deviceId, angle) => {
    wsRef.current.send(JSON.stringify({
      type: 'setAngle',
      deviceId,
      angle
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800">Vent Control System</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Floor Plan
              </label>
              <input
                type="file"
                accept=".svg"
                onChange={handleFloorPlanUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-blue-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Device
              </label>
              <select
                id="deviceSelect"
                className="block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-primary focus:ring-primary
                  sm:text-sm p-2 border"
              >
                {Object.keys(devices).map(deviceId => (
                  <option key={deviceId} value={deviceId}>{deviceId}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <Stage width={800} height={600} onClick={handleStageClick}>
              <Layer>
                {floorPlan && (
                  <Image
                    image={floorPlan}
                    width={800}
                    height={600}
                  />
                )}
                {vents.map((vent, i) => (
                  <Circle
                    key={i}
                    x={vent.x}
                    y={vent.y}
                    radius={10}
                    fill={devices[vent.deviceId]?.angle > 0 ? "#22c55e" : "#ef4444"}
                    onClick={() => {
                      const newAngle = devices[vent.deviceId]?.angle > 0 ? 0 : 90;
                      setVentAngle(vent.deviceId, newAngle);
                    }}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connected Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(devices).map(([deviceId, device]) => (
              <div key={deviceId} className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700">Device ID: {deviceId}</p>
                <p className="text-gray-600">Angle: {device.angle}°</p>
                <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  device.angle > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {device.angle > 0 ? 'Open' : 'Closed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 