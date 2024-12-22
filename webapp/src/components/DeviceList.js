import React from 'react';
import VentControl from './VentControl';

function DeviceList({ devices, onAngleChange, onConfigureDevice, onUnassignDevice, onPlaceDevice }) {
  const { assigned, unassigned } = Object.entries(devices).reduce(
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

  const DeviceCard = ({ device, showUnassign = false }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm text-gray-500 font-mono">{device.deviceId}</p>
          <p className="font-medium">{device.alias || 'Unnamed Device'}</p>
        </div>
        <div className="flex gap-2">
          {!device.assigned && (
            <button
              onClick={() => onPlaceDevice(device.deviceId)}
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
      <VentControl device={device} onAngleChange={onAngleChange} />
    </div>
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
                <DeviceCard key={device.deviceId} device={device} />
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