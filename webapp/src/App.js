import React, { useState, useEffect, useRef } from 'react';
import DeviceConfig from './components/DeviceConfig';
import DeviceList from './components/DeviceList';
import FloorPlan from './components/FloorPlan';
import FloorPlanUpload from './components/FloorPlanUpload';
import Login from './components/Login';
import { useAuth } from './contexts/AuthContext';
import HouseManager from './components/HouseManager';

console.log('Server Host:', process.env.REACT_APP_SERVER_HOST);
console.log('Server Port:', process.env.REACT_APP_SERVER_PORT);

function App() {
  // All hooks must be called before any conditional returns
  const { user, loading, logout } = useAuth();
  const wsRef = useRef(null);
  const [devices, setDevices] = useState({
    vents: {},
    sensors: {}
  });
  const [placingDevice, setPlacingDevice] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [floorPlanImage, setFloorPlanImage] = useState(null);
  const [currentHouseId, setCurrentHouseId] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState(new Set());

  // WebSocket effect
  useEffect(() => {
    if (!user) return;

    wsRef.current = new WebSocket(`ws://${process.env.REACT_APP_SERVER_HOST}:${process.env.REACT_APP_SERVER_PORT}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      
      switch(data.type) {
        case 'register':
          handleDeviceRegister(data);
          setConnectedDevices(prev => new Set([...prev, data.deviceId]));
          break;
        case 'disconnect':
          setConnectedDevices(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.deviceId);
            return newSet;
          });
          break;
        case 'angleSet':
          updateDevice(data.deviceId, { angle: data.angle });
          break;
        case 'tempUpdate':
          setConnectedDevices(prev => new Set([...prev, data.deviceId]));
          setDevices(prev => ({
            ...prev,
            sensors: {
              ...prev.sensors,
              [data.deviceId]: {
                ...(prev.sensors[data.deviceId] || {}),
                deviceId: data.deviceId,
                deviceType: 'sensor',
                temperature: data.temperature || 0,
                connected: true
              }
            }
          }));
          break;
        default:
          break;
      }
    };

    wsRef.current.onclose = () => {
      // When WebSocket closes, mark all devices as disconnected
      setConnectedDevices(new Set());
    };

    return () => {
      wsRef.current?.close();
    };
  }, [user]);

  // Helper functions
  const updateDevice = (deviceId, updates) => {
    setDevices(prev => {
      const deviceType = prev.vents[deviceId] ? 'vents' : 'sensors';
      return {
        ...prev,
        [deviceType]: {
          ...prev[deviceType],
          [deviceId]: {
            ...prev[deviceType][deviceId],
            deviceId: deviceId,  // Ensure deviceId is always set
            deviceType: deviceType === 'vents' ? 'vent' : 'sensor',  // Ensure deviceType is always set
            ...updates
          }
        }
      };
    });
  };

  const handleDeviceRegister = (data) => {
    console.log('Registering device:', data);
    
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
            minAngle: data.config?.minAngle,
            maxAngle: data.config?.maxAngle,
            position: null,
            connected: true
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
            temperature: data.currentTemp || 0,
            assigned: false,
            alias: '',
            color: '#10b981',
            floor: '1',
            position: null,
            connected: true
          }
        }
      }));
    }
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
    if (!deviceId) {
      console.error('No device ID provided to handlePlaceDevice');
      return;
    }

    console.log('Attempting to place device:', deviceId);
    console.log('Current devices state:', devices);

    // First find which collection (vents or sensors) contains this device
    let deviceType = null;
    let device = null;

    // Check if the device exists in either collection
    if (devices.vents && deviceId in devices.vents) {
      deviceType = 'vents';
      device = devices.vents[deviceId];
    } else if (devices.sensors && deviceId in devices.sensors) {
      deviceType = 'sensors';
      device = devices.sensors[deviceId];
    }

    // Debug logging
    console.log('Device lookup results:', {
      deviceId,
      deviceFound: !!device,
      deviceType,
      ventsKeys: Object.keys(devices.vents),
      sensorsKeys: Object.keys(devices.sensors)
    });

    if (!device) {
      console.error(`Device ${deviceId} not found in devices:`, {
        vents: devices.vents,
        sensors: devices.sensors
      });
      return;
    }

    if (!device.assigned) {
      setPlacingDevice(deviceId);
    }
  };

  const handleMapClick = (position) => {
    if (!placingDevice) return;

    // Check device type again when placing
    const deviceType = devices.vents[placingDevice] ? 'vents' : 
                      devices.sensors[placingDevice] ? 'sensors' : null;
                      
    if (!deviceType) {
      console.error('Device not found:', placingDevice);
      setPlacingDevice(null);
      return;
    }

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
      wsRef.current?.send(JSON.stringify({
        type: 'setAngle',
        deviceId,
        angle
      }));
    }
  };

  const handleImageLoad = (imageData) => {
    setFloorPlanImage(imageData);
    if (currentHouseId) {
      saveArrangement();
    }
  };

  // Load arrangement on login
  useEffect(() => {
    if (user && currentHouseId) {
      loadArrangement();
    }
  }, [user, currentHouseId]);

  // Save arrangement when changes are made
  useEffect(() => {
    if (currentHouseId && (floorPlanImage || Object.keys(devices.vents).length > 0 || Object.keys(devices.sensors).length > 0)) {
      const debounceTimer = setTimeout(() => {
        saveArrangement();
      }, 1000); // Debounce save to prevent too many requests

      return () => clearTimeout(debounceTimer);
    }
  }, [currentHouseId, floorPlanImage, devices]);

  const loadArrangement = async (houseId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/houses/${houseId}/arrangement`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load arrangement');

      const data = await response.json();
      if (data.floorPlan) {
        setFloorPlanImage(data.floorPlan);
      }
      if (data.devices) {
        setDevices(data.devices);
      }
    } catch (err) {
      console.error('Error loading arrangement:', err);
    }
  };

  const handleHouseSelect = async (houseId) => {
    setCurrentHouseId(houseId);
    if (houseId) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/houses/${houseId}/arrangement`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to load arrangement');

        const data = await response.json();
        
        // Clear existing data first
        setFloorPlanImage(null);
        setDevices({ vents: {}, sensors: {} });
        
        // Then set new data
        if (data.floorPlan) {
          setFloorPlanImage(data.floorPlan);
        }
        if (data.devices) {
          setDevices(data.devices);
        }
        
        console.log('Layout loaded successfully');
      } catch (err) {
        console.error('Error loading layout:', err);
      }
    } else {
      // Clear the current layout if no house is selected
      setFloorPlanImage(null);
      setDevices({ vents: {}, sensors: {} });
    }
  };

  const saveArrangement = async () => {
    if (!currentHouseId) {
      console.log('No layout selected - changes will not be saved');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/houses/${currentHouseId}/arrangement`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            floorPlan: floorPlanImage,
            devices: devices
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save arrangement');
      }

      console.log('Layout saved successfully');
    } catch (err) {
      console.error('Error saving layout:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Login state
  if (!user) {
    return <Login />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Vent Control System</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <HouseManager
            currentHouseId={currentHouseId}
            onHouseSelect={handleHouseSelect}
          />
          {!currentHouseId && (
            <div className="mt-2 text-sm text-gray-600">
              Note: Create or select a layout to save your changes
            </div>
          )}
        </div>

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