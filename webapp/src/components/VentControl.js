import React from 'react';

function VentControl({ device, onAngleChange }) {
  const handleChange = (e) => {
    const angle = parseInt(e.target.value);
    onAngleChange(device.deviceId, angle);
  };

  const handleToggle = () => {
    const newAngle = device.angle > 0 ? 0 : device.maxAngle || 90;
    onAngleChange(device.deviceId, newAngle);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {device.angle > 0 ? 'Open' : 'Closed'}
        </span>
        <button
          onClick={handleToggle}
          className={`px-3 py-1 rounded-md text-white text-sm ${
            device.angle > 0 ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {device.angle > 0 ? 'Close' : 'Open'}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={device.minAngle || 0}
          max={device.maxAngle || 90}
          value={device.angle || 0}
          onChange={handleChange}
          className="flex-1"
        />
        <span className="text-sm font-medium w-12">{device.angle || 0}°</span>
      </div>
    </div>
  );
}

export default VentControl; 