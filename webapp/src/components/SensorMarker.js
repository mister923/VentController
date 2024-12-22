import React from 'react';
import { Group, Circle, Text } from 'react-konva';

function SensorMarker({ x, y, device, onClick }) {
  const radius = 30;
  
  return (
    <Group 
      x={x} 
      y={y} 
      onClick={onClick}
    >
      <Circle
        radius={radius}
        fill={device.color || '#10b981'}
        opacity={0.2}
      />
      <Circle
        radius={radius - 5}
        fill={device.color || '#10b981'}
        opacity={0.8}
      />
      <Text
        text={device.alias || 'Sensor'}
        fontSize={12}
        fill="white"
        align="center"
        width={radius * 2}
        x={-radius}
        y={-12}
      />
      <Text
        text={`${device.temperature.toFixed(1)}°C`}
        fontSize={14}
        fontStyle="bold"
        fill="white"
        align="center"
        width={radius * 2}
        x={-radius}
        y={2}
      />
    </Group>
  );
}

export default SensorMarker; 