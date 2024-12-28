const express = require('express');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const db = new sqlite3.Database('./database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(express.json());
app.use(cors());

// Database initialization
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  // Houses table
  db.run(`CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    floor_plan TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Modified Devices table with nullable house_id
  db.run(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER,
    device_id TEXT NOT NULL UNIQUE,
    device_details TEXT,
    position_x REAL,
    position_y REAL,
    floor TEXT,
    FOREIGN KEY (house_id) REFERENCES houses (id)
  )`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              reject(new Error('Username already exists'));
            } else {
              reject(err);
            }
          }
          resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    if (err.message === 'Username already exists') {
      res.status(400).json({ error: err.message });
    } else {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// House routes
app.get('/api/houses', authenticateToken, (req, res) => {
  console.log('Getting houses for user:', req.user.id); // Debug log
  db.all('SELECT * FROM houses WHERE user_id = ?', [req.user.id],
    (err, houses) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Found houses:', houses); // Debug log
      res.json(houses);
    }
  );
});

app.post('/api/houses', authenticateToken, (req, res) => {
  const { name } = req.body;
  console.log('Creating house:', { name, userId: req.user.id }); // Debug log
  
  if (!name) return res.status(400).json({ error: 'Name is required' });

  db.run('INSERT INTO houses (user_id, name) VALUES (?, ?)',
    [req.user.id, name],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        user_id: req.user.id
      });
    }
  );
});

// Set default house
app.put('/api/houses/:id/default', authenticateToken, async (req, res) => {
  const houseId = req.params.id;
  
  try {
    // First verify house belongs to user
    const house = await db.get(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?',
      [houseId, req.user.id]
    );

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Remove default from all user's houses
    await db.run(
      'UPDATE houses SET is_default = 0 WHERE user_id = ?',
      [req.user.id]
    );

    // Set new default
    await db.run(
      'UPDATE houses SET is_default = 1 WHERE id = ?',
      [houseId]
    );

    res.json({ message: 'Default house updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device routes
app.post('/api/devices', authenticateToken, (req, res) => {
  const { houseId, deviceId, deviceType, ...deviceData } = req.body;
  db.run(`INSERT INTO devices (
    house_id, device_id, device_type, alias, color, 
    position_x, position_y, angle, min_angle, max_angle, floor
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [houseId, deviceId, deviceType, deviceData.alias, deviceData.color,
     deviceData.position?.x, deviceData.position?.y, deviceData.angle,
     deviceData.minAngle, deviceData.maxAngle, deviceData.floor],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Track connected devices and their WebSocket connections
const connectedDevices = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New connection established');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received WebSocket message:', data);

    switch(data.type) {
      case 'register':
        // Store WebSocket connection
        connectedDevices.set(data.deviceId, ws);
        
        // Store all device details as JSON
        const deviceDetails = {
          deviceType: data.deviceType,
          deviceId: data.deviceId,
          alias: '',
          color: data.deviceType === 'vent' ? '#3b82f6' : '#10b981',
          floor: '1',
          assigned: false,
          position: null,
          ...(data.deviceType === 'vent' 
            ? {
                angle: data.currentAngle || 0,
                minAngle: data.config?.minAngle || 0,
                maxAngle: data.config?.maxAngle || 90
              }
            : {
                temperature: data.currentTemp
              }
          )
        };

        // Save device in database without house_id
        db.run(
          'INSERT OR REPLACE INTO devices (device_id, device_details) VALUES (?, ?)',
          [data.deviceId, JSON.stringify(deviceDetails)],
          (err) => {
            if (err) {
              console.error('Error saving device:', err);
              return;
            }
            
            // Forward registration to all clients
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'register',
                  ...deviceDetails
                }));
              }
            });
          }
        );
        break;

      case 'setAngle':
        // Update angle in device_details JSON
        db.get(
          'SELECT device_details FROM devices WHERE device_id = ?',
          [data.deviceId],
          (err, row) => {
            if (err) {
              console.error('Error fetching device details:', err);
              return;
            }

            if (!row) {
              console.error('Device not found:', data.deviceId);
              return;
            }

            try {
              const details = JSON.parse(row.device_details);
              details.angle = data.angle;

              // Update the device_details with new angle
              db.run(
                'UPDATE devices SET device_details = ? WHERE device_id = ?',
                [JSON.stringify(details), data.deviceId],
                (err) => {
                  if (err) {
                    console.error('Error updating device angle:', err);
                    return;
                  }

                  // Forward to all clients
                  wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'angleSet',
                        deviceId: data.deviceId,
                        angle: data.angle
                      }));
                    }
                  });
                }
              );
            } catch (err) {
              console.error('Error parsing device details:', err);
            }
          }
        );
        break;

      case 'tempUpdate':
        // Forward temperature updates
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
        break;
    }
  });

  ws.on('close', () => {
    // Remove disconnected device
    for (const [deviceId, socket] of connectedDevices.entries()) {
      if (socket === ws) {
        connectedDevices.delete(deviceId);
        console.log(`Device disconnected: ${deviceId}`);
        break;
      }
    }
  });
});

// Add token validation endpoint
app.get('/api/validate', authenticateToken, (req, res) => {
  // Token is valid if we get here (due to authenticateToken middleware)
  res.json({ 
    username: req.user.username,
    id: req.user.id 
  });
});

// Save floor plan and device arrangement
app.post('/api/houses/:houseId/arrangement', authenticateToken, async (req, res) => {
  const { floorPlan, devices } = req.body;
  const houseId = req.params.houseId;

  try {
    // First verify house belongs to user
    const house = await db.get(
      'SELECT * FROM houses WHERE id = ? AND user_id = ?',
      [houseId, req.user.id]
    );

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Update floor plan
    await db.run(
      'UPDATE houses SET floor_plan = ? WHERE id = ?',
      [JSON.stringify(floorPlan), houseId]
    );

    // Update devices
    for (const deviceType of ['vents', 'sensors']) {
      for (const [deviceId, device] of Object.entries(devices[deviceType] || {})) {
        await db.run(
          'UPDATE devices SET house_id = ?, device_details = ? WHERE device_id = ?',
          [
            houseId,
            JSON.stringify(device),
            deviceId
          ]
        );
      }
    }

    res.json({ message: 'Arrangement saved successfully' });
  } catch (err) {
    console.error('Error saving arrangement:', err);
    res.status(500).json({ error: 'Failed to save arrangement' });
  }
});

// Load floor plan and device arrangement
app.get('/api/houses/:houseId/arrangement', authenticateToken, async (req, res) => {
  const houseId = req.params.houseId;

  try {
    // Get house data
    const house = await db.get('SELECT * FROM houses WHERE id = ? AND user_id = ?',
      [houseId, req.user.id]);

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Get devices data
    const devices = await db.all('SELECT device_id, device_details FROM devices WHERE house_id = ?', [houseId]);

    const arrangement = {
      floorPlan: house.floor_plan ? JSON.parse(house.floor_plan) : null,
      devices: {
        vents: {},
        sensors: {}
      }
    };

    // Process devices
    devices.forEach(device => {
      const details = JSON.parse(device.device_details);
      if (details.deviceType === 'vent') {
        arrangement.devices.vents[device.device_id] = details;
      } else if (details.deviceType === 'sensor') {
        arrangement.devices.sensors[device.device_id] = details;
      }
    });

    res.json(arrangement);
  } catch (err) {
    console.error('Error loading arrangement:', err);
    res.status(500).json({ error: 'Failed to load arrangement' });
  }
});

// Start the server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 