import React from 'react';
import VentControl from './VentControl';
import SensorDisplay from './SensorDisplay';

function DeviceCard({ 
  device, 
  showUnassign = false, 
  onPlaceDevice, 
  onUnassignDevice, 
  onConfigureDevice,
  onAngleChange 
}) {
  console.log('Device in DeviceCard:', {
    fullDevice: device,
    id: device.deviceId,
    type: device.deviceType,
    temperature: device.temperature
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium mb-1">
                {device.alias || `Unnamed ${device.deviceType === 'vent' ? 'Vent' : 'Sensor'}`}
              </p>
              <span className="inline-block bg-blue-50 border border-blue-200 px-3 py-1 rounded-md text-blue-700 font-mono text-sm">
                ID: {device.deviceId}
              </span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                device.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {device.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Type: {device.deviceType} | ID: {device.id || device.deviceId}
          </p>
        </div>
        <div className="flex gap-2">
          {!device.assigned && (
            <button
              onClick={() => {
                const deviceId = device.deviceId;
                console.log('Attempting to place device with ID:', deviceId, 'Full device:', device);
                if (!deviceId) {
                  console.error('No device ID found in device object:', device);
                  return;
                }
                try {
                  onPlaceDevice(deviceId);
                } catch (err) {
                  console.error('Error details:', err);
                  alert(`Error placing device: ${err.message}`);
                }
              }}
              className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
              title="Place on Map"
            >
              Place on Map
            </button>
          )}
          {showUnassign && (
            <button
              onClick={() => onUnassignDevice(device.deviceId)}
              className="p-1 text-gray-500 hover:text-red-500"
              title="Remove from Map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onConfigureDevice(device)}
            className="p-1 text-gray-500 hover:text-blue-500"
            title="Configure Device"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </button>
        </div>
      </div>
      {device.deviceType === 'vent' ? (
        <VentControl device={device} onAngleChange={onAngleChange} />
      ) : (
        <SensorDisplay device={device} />
      )}
    </div>
  );
}

export default DeviceCard; 