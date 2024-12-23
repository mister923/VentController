import React from 'react';
import { Group, Circle, Text } from 'react-konva';

function SensorMarker({ x, y, device, scale = { x: 1, y: 1 }, onClick }) {
  const radius = 30 * scale.x;
  
  return (
    <Group 
      x={x} 
      y={y} 
      onClick={onClick}
    >
      {/* Outer circle (background) */}
      <Circle
        radius={radius}
        fill={device.color || '#10b981'}
        opacity={0.2}
      />
      {/* Inner circle (foreground) */}
      <Circle
        radius={radius - 5 * scale.x}
        fill={device.color || '#10b981'}
        opacity={0.8}
      />
      {/* Device name */}
      <Text
        text={device.alias || 'Sensor'}
        fontSize={12 * scale.x}
        fill="white"
        align="center"
        width={radius * 2}
        x={-radius}
        y={-12 * scale.y}
      />
      {/* Temperature display */}
      <Text
        text={`${device.temperature?.toFixed(1) || '0.0'}°C`}
        fontSize={14 * scale.x}
        fontStyle="bold"
        fill="white"
        align="center"
        width={radius * 2}
        x={-radius}
        y={2 * scale.y}
      />
    </Group>
  );
}

export default SensorMarker;