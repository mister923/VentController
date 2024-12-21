import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';

function App() {
  const [devices, setDevices] = useState({});
  const [floorPlan, setFloorPlan] = useState(null);
  const [vents, setVents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'register':
          setDevices(prev => ({
            ...prev,
            [data.deviceId]: { angle: data.currentAngle }
          }));
          break;
          
        case 'angleSet':
          setDevices(prev => ({
            ...prev,
            [data.deviceId]: { ...prev[data.deviceId], angle: data.angle }
          }));
          break;
      }
    };

    return () => {
      wsRef.current.close();
    };
  }, []);

  const handleFloorPlanUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      setFloorPlan(e.target.result);
    };
    
    reader.readAsDataURL(file);
  };

  const handleStageClick = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const deviceId = document.getElementById('deviceSelect').value;
    
    if (deviceId) {
      setVents(prev => [...prev, {
        x: pos.x,
        y: pos.y,
        deviceId
      }]);
    }
  };

  const setVentAngle = (deviceId, angle) => {
    wsRef.current.send(JSON.stringify({
      type: 'setAngle',
      deviceId,
      angle
    }));
  };

  return (
    <div>
      <div>
        <input type="file" accept=".svg" onChange={handleFloorPlanUpload} />
        <select id="deviceSelect">
          {Object.keys(devices).map(deviceId => (
            <option key={deviceId} value={deviceId}>{deviceId}</option>
          ))}
        </select>
      </div>

      <Stage width={800} height={600} onClick={handleStageClick}>
        <Layer>
          {floorPlan && (
            <Image
              image={new window.Image()}
              src={floorPlan}
              width={800}
              height={600}
            />
          )}
          {vents.map((vent, i) => (
            <Circle
              key={i}
              x={vent.x}
              y={vent.y}
              radius={10}
              fill={devices[vent.deviceId]?.angle > 0 ? "green" : "red"}
              onClick={() => {
                const newAngle = devices[vent.deviceId]?.angle > 0 ? 0 : 90;
                setVentAngle(vent.deviceId, newAngle);
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App; 