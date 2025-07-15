'use client'; // ต้องระบุว่านี่คือ Client Component เพราะใช้ useState

import React, { useState } from 'react';

const AddMaintenancePage: React.FC = () => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/maintenance', { // ชี้ไปที่ API Endpoint ที่สร้างไว้
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, date, cost: parseFloat(cost), notes }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Data added successfully!');
        setDescription('');
        setDate('');
        setCost('');
        setNotes('');
      } else {
        setMessage(`Error: ${data.message || 'Something went wrong'}`);
      }
    } catch (error) {
      setMessage(`Fetch error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Add New Maintenance Item</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Description:</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div>
          <label>Date (YYYY-MM-DD):</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>Cost:</label>
          <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
        </div>
        <div>
          <label>Notes:</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit">Add Item</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddMaintenancePage;
