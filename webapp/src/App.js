import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';
import DeviceConfig from './components/DeviceConfig';
import DeviceList from './components/DeviceList';
import VentControl from './components/VentControl';
import VentMarker from './components/VentMarker';
import FloorPlan from './components/FloorPlan';
import FloorPlanUpload from './components/FloorPlanUpload';

function App() {
  const wsRef = useRef(null);
  const [devices, setDevices] = useState({
    vents: {},
    sensors: {}
  });
  const [placingDevice, setPlacingDevice] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [floorPlanImage, setFloorPlanImage] = useState(null);

  // Add console log to check devices state
  useEffect(() => {
    console.log('Current devices state:', devices);
  }, [devices]);

  // Helper function to update a specific device
  const updateDevice = (deviceId, updates) => {
    setDevices(prev => {
      // Determine if the device is a vent or sensor
      const deviceType = prev.vents[deviceId] ? 'vents' : 'sensors';
      
      return {
        ...prev,
        [deviceType]: {
          ...prev[deviceType],
          [deviceId]: {
            ...prev[deviceType][deviceId],
            ...updates
          }
        }
      };
    });
  };

  const handleConfigureDevice = (device) => {
    setSelectedDevice(device);
    setShowConfig(true);
  };

  const handleConfigSave = (config) => {
    if (selectedDevice) {
      updateDevice(selectedDevice.deviceId, {
        ...config,
        assigned: selectedDevice.assigned
      });
    }
    setShowConfig(false);
    setSelectedDevice(null);
  };

  const handlePlaceDevice = (deviceId) => {
    console.log('Attempting to place device:', deviceId);
    const deviceType = devices.vents[deviceId] ? 'vents' : 'sensors';
    if (!devices[deviceType][deviceId].assigned) {
      setPlacingDevice(deviceId);
    }
  };

  const handleMapClick = (position) => {
    console.log('Map clicked:', position);
    if (placingDevice) {
      const deviceType = devices.vents[placingDevice] ? 'vents' : 'sensors';
      console.log('Placing device:', placingDevice, 'of type:', deviceType);
      
      setDevices(prev => ({
        ...prev,
        [deviceType]: {
          ...prev[deviceType],
          [placingDevice]: {
            ...prev[deviceType][placingDevice],
            assigned: true,
            position: position
          }
        }
      }));
      setPlacingDevice(null);
    }
  };

  const handleUnassignDevice = (deviceId) => {
    const deviceType = devices.vents[deviceId] ? 'vents' : 'sensors';
    updateDevice(deviceId, {
      assigned: false,
      position: null
    });
  };

  const setVentAngle = (deviceId, angle) => {
    if (!devices.vents[deviceId]) return;

    const device = devices.vents[deviceId];
    const minAngle = device.minAngle || 0;
    const maxAngle = device.maxAngle || 90;
    
    if (angle >= minAngle && angle <= maxAngle) {
      // Update local state
      updateDevice(deviceId, { angle: angle });

      // Send to server
      wsRef.current?.send(JSON.stringify({
        type: 'setAngle',
        deviceId,
        angle
      }));
    }
  };

  // WebSocket connection and message handling
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      
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
                  maxAngle: data.config.maxAngle,
                  position: null
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
                  floor: '1',
                  position: null
                }
              }
            }));
          }
          break;
          
        case 'angleSet':
          updateDevice(data.deviceId, { angle: data.angle });
          break;

        case 'tempUpdate':
          updateDevice(data.deviceId, { temperature: data.temperature });
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleImageLoad = (image) => {
    setFloorPlanImage(image);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800">Vent Control System</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6 gap-6">
          <div className="md:col-span-2 w-full">
            <FloorPlanUpload 
              onImageLoad={handleImageLoad} 
              hasImage={floorPlanImage !== null} 
            />
            <FloorPlan
              devices={devices}
              placingDevice={placingDevice}
              onMapClick={handleMapClick}
              floorPlanImage={floorPlanImage}
            />
          </div>
          <div className="w-full">
            <DeviceList
              devices={devices}
              onAngleChange={setVentAngle}
              onConfigureDevice={handleConfigureDevice}
              onUnassignDevice={handleUnassignDevice}
              onPlaceDevice={handlePlaceDevice}
            />
          </div>
        </div>
      </div>

      {showConfig && (
        <DeviceConfig
          device={selectedDevice}
          onClose={() => setShowConfig(false)}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
}

export default App; 