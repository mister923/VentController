import React, { useState } from 'react';

function DeviceConfig({ onClose, onSave, device = {} }) {
  const [config, setConfig] = useState({
    deviceId: device.deviceId || '',
    alias: device.alias || '',
    color: device.color || '#3b82f6',
    floor: device.floor || '1',
    minAngle: device.minAngle || 0,
    maxAngle: device.maxAngle || 90,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">
          {device.deviceId ? 'Edit Device' : 'New Device'}
        </h2>
        <form onSubmit={handleSubmit}>
          {device.deviceId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID
              </label>
              <div className="w-full p-2 bg-gray-50 border rounded-md text-gray-600 font-mono text-sm">
                {device.deviceId}
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alias
            </label>
            <input
              type="text"
              value={config.alias}
              onChange={(e) => setConfig({ ...config, alias: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="Living Room Vent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={config.color}
              onChange={(e) => setConfig({ ...config, color: e.target.value })}
              className="w-full p-2 border rounded-md h-10"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor
            </label>
            <input
              type="number"
              value={config.floor}
              onChange={(e) => setConfig({ ...config, floor: e.target.value })}
              className="w-full p-2 border rounded-md"
              min="1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Angle Range
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                value={config.minAngle}
                onChange={(e) => setConfig({ ...config, minAngle: parseInt(e.target.value) })}
                className="w-1/2 p-2 border rounded-md"
                placeholder="Min"
                required
              />
              <input
                type="number"
                value={config.maxAngle}
                onChange={(e) => setConfig({ ...config, maxAngle: parseInt(e.target.value) })}
                className="w-1/2 p-2 border rounded-md"
                placeholder="Max"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceConfig;