import React from 'react';

function SensorDisplay({ device }) {
  const temperature = device?.temperature ?? 0;
  
  return (
    <div className="mt-2">
      <p className="text-lg font-medium">
        Temperature: {temperature.toFixed(1)}°C
      </p>
    </div>
  );
}

export default SensorDisplay; 