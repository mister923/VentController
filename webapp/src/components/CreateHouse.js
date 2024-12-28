import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function CreateHouse({ onCreated }) {
  const [name, setName] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/houses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('Failed to create house');

      const house = await response.json();
      onCreated(house);
      setName('');
    } catch (err) {
      console.error('Error creating house:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter house name"
          className="flex-1 rounded-md border-gray-300 shadow-sm"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add House
        </button>
      </div>
    </form>
  );
}

export default CreateHouse; 