import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function HouseManager({ currentHouseId, onHouseSelect }) {
  const [houses, setHouses] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  useEffect(() => {
    loadHouses();
  }, [user]);

  const loadHouses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/houses`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      }
    } catch (err) {
      console.error('Error loading houses:', err);
    }
  };

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    if (!newHouseName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/houses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newHouseName })
      });

      if (response.ok) {
        const newHouse = await response.json();
        setHouses(prev => [...prev, newHouse]);
        setNewHouseName('');
        setIsCreating(false);
        onHouseSelect(newHouse.id);
      }
    } catch (err) {
      console.error('Error creating house:', err);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1">
        <label htmlFor="layout-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Layout
        </label>
        <select
          id="layout-select"
          value={currentHouseId || ''}
          onChange={(e) => onHouseSelect(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Choose a layout...</option>
          {houses.map(house => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
      </div>

      {isCreating ? (
        <form onSubmit={handleCreateHouse} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newHouseName}
            onChange={(e) => setNewHouseName(e.target.value)}
            placeholder="New layout name"
            className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 whitespace-nowrap"
        >
          New Layout
        </button>
      )}
    </div>
  );
}

export default HouseManager; 