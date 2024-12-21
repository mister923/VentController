const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8081 });

const clients = new Map();

server.on('connection', (ws) => {
  let deviceId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'register') {
      deviceId = data.deviceId;
      clients.set(deviceId, ws);
      
      // Broadcast device list to all clients
      server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else if (data.type === 'setAngle') {
      const targetDevice = clients.get(data.deviceId);
      if (targetDevice) {
        targetDevice.send(message);
      }
    }
  });

  ws.on('close', () => {
    if (deviceId) {
      clients.delete(deviceId);
    }
  });
}); 