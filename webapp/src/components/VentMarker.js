import React from 'react';
import { Group, Rect, Text } from 'react-konva';

function VentMarker({ x, y, device, onClick }) {
  const width = 80;
  const height = 60;
  
  return (
    <Group 
      x={x - width/2} 
      y={y - height/2} 
      onClick={onClick}
    >
      {/* Background rectangle */}
      <Rect
        width={width}
        height={height}
        fill={device.color || '#3b82f6'}
        opacity={0.2}
        cornerRadius={5}
      />
      {/* Foreground rectangle */}
      <Rect
        x={5}
        y={5}
        width={width - 10}
        height={height - 10}
        fill={device.color || '#3b82f6'}
        opacity={0.8}
        cornerRadius={3}
      />
      {/* Device name */}
      <Text
        text={device.alias || 'Vent'}
        fontSize={12}
        fill="white"
        align="center"
        width={width}
        y={12}
      />
      {/* Angle display */}
      <Text
        text={`${device.angle || 0}°`}
        fontSize={14}
        fontStyle="bold"
        fill="white"
        align="center"
        width={width}
        y={height - 25}
      />
    </Group>
  );
}

export default VentMarker; 