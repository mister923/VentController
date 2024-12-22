import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';
import DeviceConfig from './components/DeviceConfig';
import DeviceList from './components/DeviceList';
import VentControl from './components/VentControl';
import VentMarker from './components/VentMarker';

function App() {
  const [devices, setDevices] = useState({
    vents: {},
    sensors: {}
  });
  const [floorPlan, setFloorPlan] = useState(null);
  const [vents, setVents] = useState([]);
  const [draggingDevice, setDraggingDevice] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceConfig, setShowDeviceConfig] = useState(false);
  const wsRef = useRef(null);
  const [placingDevice, setPlacingDevice] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'register':
          if (data.deviceType === 'vent') {
            setDevices(prev => ({
              ...prev,
              vents: {
                ...prev.vents,
                [data.deviceId]: {
                  deviceId: data.deviceId,
                  deviceType: 'vent',
                  angle: data.currentAngle,
                  assigned: false,
                  alias: '',
                  color: '#3b82f6',
                  floor: '1',
                  minAngle: data.config.minAngle,
                  maxAngle: data.config.maxAngle
                }
              }
            }));
          } else if (data.deviceType === 'sensor') {
            setDevices(prev => ({
              ...prev,
              sensors: {
                ...prev.sensors,
                [data.deviceId]: {
                  deviceId: data.deviceId,
                  deviceType: 'sensor',
                  temperature: data.currentTemp,
                  assigned: false,
                  alias: '',
                  color: '#10b981',
                  floor: '1'
                }
              }
            }));
          }
          break;
          
        case 'angleSet':
          setDevices(prev => ({
            ...prev,
            vents: {
              ...prev.vents,
              [data.deviceId]: { 
                ...prev.vents[data.deviceId], 
                angle: data.angle 
              }
            }
          }));
          break;

        case 'tempUpdate':
          setDevices(prev => ({
            ...prev,
            sensors: {
              ...prev.sensors,
              [data.deviceId]: { 
                ...prev.sensors[data.deviceId], 
                temperature: data.temperature 
              }
            }
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

  const handleDragStart = (deviceId) => {
    setDraggingDevice(deviceId);
  };

  const handleStageClick = (e) => {
    if (!placingDevice) return;
    
    const pos = e.target.getStage().getPointerPosition();
    setVents(prev => [...prev, {
      x: pos.x,
      y: pos.y,
      deviceId: placingDevice
    }]);
    
    // Mark device as assigned
    setDevices(prev => ({
      ...prev,
      [placingDevice]: {
        ...prev[placingDevice],
        assigned: true
      }
    }));
    
    setPlacingDevice(null);
  };

  const handleVentClick = (device) => {
    setSelectedDevice(device);
  };

  const handleAllVents = (angle) => {
    Object.keys(devices).forEach(deviceId => {
      setVentAngle(deviceId, angle);
    });
  };

  const handleConfigureDevice = (device) => {
    setSelectedDevice(device);
    setShowDeviceConfig(true);
  };

  const handleDeviceConfig = (config) => {
    setDevices(prev => ({
      ...prev,
      [config.deviceId]: {
        ...prev[config.deviceId],
        alias: config.alias,
        color: config.color,
        floor: config.floor,
        minAngle: config.minAngle,
        maxAngle: config.maxAngle
      }
    }));
    setShowDeviceConfig(false);
    setSelectedDevice(null);
  };

  const setVentAngle = (deviceId, angle) => {
    const device = devices[deviceId];
    if (!device) return;

    // Validate angle is within device's range
    const minAngle = device.minAngle || 0;
    const maxAngle = device.maxAngle || 90;
    
    if (angle >= minAngle && angle <= maxAngle) {
      // Update local state
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          angle: angle
        }
      }));

      // Send to server
      wsRef.current.send(JSON.stringify({
        type: 'setAngle',
        deviceId,
        angle
      }));
    } else {
      console.warn('Angle out of range for device:', deviceId);
    }
  };

  const handleUnassignDevice = (deviceId) => {
    setVents(prev => prev.filter(vent => vent.deviceId !== deviceId));
    
    setDevices(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        assigned: false
      }
    }));
  };

  const handlePlaceDevice = (deviceId) => {
    setPlacingDevice(deviceId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800">Vent Control System</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Floor Plan Section */}
          <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Floor Plan
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFloorPlanUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-blue-600"
              />
              {placingDevice && (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
                  Click on the map to place the selected vent
                </div>
              )}
            </div>
            
            <Stage width={800} height={600} onClick={handleStageClick}>
              <Layer>
                {floorPlan && (
                  <Image
                    image={floorPlan}
                    width={800}
                    height={600}
                  />
                )}
                {vents.map((vent, i) => {
                  const device = devices[vent.deviceId];
                  return (
                    <VentMarker
                      key={i}
                      x={vent.x}
                      y={vent.y}
                      device={device}
                      onClick={() => handleVentClick(device)}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </div>

          {/* Connected Devices */}
          <div className="bg-white rounded-lg shadow-md p-6 overflow-auto max-h-[800px]">
            <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
            <DeviceList
              devices={devices}
              onAngleChange={setVentAngle}
              onConfigureDevice={handleConfigureDevice}
              onUnassignDevice={handleUnassignDevice}
              onPlaceDevice={handlePlaceDevice}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showDeviceConfig && (
        <DeviceConfig
          device={selectedDevice}
          onClose={() => {
            setShowDeviceConfig(false);
            setSelectedDevice(null);
          }}
          onSave={handleDeviceConfig}
        />
      )}
      
      {selectedDevice && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-72">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">{selectedDevice.alias || selectedDevice.deviceId}</h3>
            <button
              onClick={() => setSelectedDevice(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <VentControl device={selectedDevice} onAngleChange={setVentAngle} />
        </div>
      )}
    </div>
  );
}

export default App; 