import React from 'react';

function SensorDisplay({ device }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Temperature</span>
        <span className="text-lg font-medium">{device.temperature.toFixed(1)}°C</span>
      </div>
    </div>
  );
}

export default SensorDisplay; 