import React from 'react';
import DeviceCard from './DeviceCard';

function DeviceList({ devices, onAngleChange, onConfigureDevice, onUnassignDevice, onPlaceDevice }) {
  // Combine vents and sensors from the devices object
  const allDevices = {
    ...devices.vents,
    ...devices.sensors
  };

  const { assigned, unassigned } = Object.entries(allDevices).reduce(
    (acc, [id, device]) => {
      if (device.assigned) {
        acc.assigned.push(device);
      } else {
        acc.unassigned.push(device);
      }
      return acc;
    },
    { assigned: [], unassigned: [] }
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {unassigned.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center">
              Unassigned Devices
              <span className="ml-2 text-sm text-gray-500">({unassigned.length})</span>
              <span className="ml-2 text-sm text-gray-500">Drag to assign</span>
            </h3>
            <div className="space-y-4">
              {unassigned.map(device => (
                <DeviceCard 
                  key={device.deviceId} 
                  device={device}
                  onPlaceDevice={onPlaceDevice}
                  onUnassignDevice={onUnassignDevice}
                  onConfigureDevice={onConfigureDevice}
                  onAngleChange={onAngleChange}
                />
              ))}
            </div>
          </div>
        )}

        {assigned.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Assigned Devices
              <span className="ml-2 text-sm text-gray-500">
                ({assigned.length})
              </span>
            </h3>
            <div className="space-y-4">
              {assigned.map(device => (
                <DeviceCard 
                  key={device.deviceId} 
                  device={device} 
                  showUnassign={true}
                  onPlaceDevice={onPlaceDevice}
                  onUnassignDevice={onUnassignDevice}
                  onConfigureDevice={onConfigureDevice}
                  onAngleChange={onAngleChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceList; 