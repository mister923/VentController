import React from 'react';
import { Group, Rect, Text } from 'react-konva';

function VentMarker({ x, y, device, scale = { x: 1, y: 1 }, onClick }) {
  const width = 80 * scale.x;
  const height = 60 * scale.y;
  
  return (
    <Group 
      x={x - width/2} 
      y={y - height/2}
      onClick={onClick}
    >
      <Rect
        width={width}
        height={height}
        fill={device.color || '#3b82f6'}
        opacity={0.2}
        cornerRadius={5 * scale.x}
      />
      <Rect
        x={5 * scale.x}
        y={5 * scale.y}
        width={width - 10 * scale.x}
        height={height - 10 * scale.y}
        fill={device.color || '#3b82f6'}
        opacity={0.8}
        cornerRadius={3 * scale.x}
      />
      <Text
        text={device.alias || 'Vent'}
        fontSize={12 * scale.x}
        fill="white"
        align="center"
        width={width}
        y={12 * scale.y}
      />
      <Text
        text={`${device.angle || 0}°`}
        fontSize={14 * scale.x}
        fontStyle="bold"
        fill="white"
        align="center"
        width={width}
        y={height - 25 * scale.y}
      />
    </Group>
  );
}

export default VentMarker; 