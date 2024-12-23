import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Image } from 'react-konva';
import VentMarker from './VentMarker';
import SensorMarker from './SensorMarker';

function FloorPlan({ devices, placingDevice, onMapClick, floorPlanImage }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        // Maintain aspect ratio (4:3)
        const containerHeight = containerWidth * 0.75;
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    // Initial update
    updateDimensions();

    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleStageClick = (e) => {
    if (!placingDevice) return;
    
    const stage = e.target.getStage();
    const position = stage.getPointerPosition();
    onMapClick(position);
  };

  const renderDevices = () => {
    const markers = [];
    
    // Render vent markers
    Object.values(devices.vents || {}).forEach(device => {
      if (device.assigned && device.position) {
        // Scale position based on current dimensions
        const scaledX = (device.position.x / 800) * dimensions.width;
        const scaledY = (device.position.y / 600) * dimensions.height;
        
        markers.push(
          <VentMarker
            key={device.deviceId}
            x={scaledX}
            y={scaledY}
            device={device}
            scale={{
              x: dimensions.width / 800,
              y: dimensions.height / 600
            }}
          />
        );
      }
    });

    // Render sensor markers
    Object.values(devices.sensors || {}).forEach(device => {
      if (device.assigned && device.position) {
        // Scale position based on current dimensions
        const scaledX = (device.position.x / 800) * dimensions.width;
        const scaledY = (device.position.y / 600) * dimensions.height;
        
        markers.push(
          <SensorMarker
            key={device.deviceId}
            x={scaledX}
            y={scaledY}
            device={device}
            scale={{
              x: dimensions.width / 800,
              y: dimensions.height / 600
            }}
          />
        );
      }
    });

    return markers;
  };

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-lg p-4 w-full">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        className={placingDevice ? 'cursor-crosshair' : 'cursor-default'}
      >
        <Layer>
          {/* Floor plan background */}
          {floorPlanImage && (
            <Image
              image={floorPlanImage}
              width={dimensions.width}
              height={dimensions.height}
              opacity={0.5}
            />
          )}
          
          {/* Background grid or color when no image */}
          {!floorPlanImage && (
            <Rect 
              width={dimensions.width}
              height={dimensions.height}
              fill="#f3f4f6" 
              stroke="#e5e7eb"
            />
          )}
          
          {/* Render device markers */}
          {renderDevices()}
        </Layer>
      </Stage>
    </div>
  );
}

export default FloorPlan; 