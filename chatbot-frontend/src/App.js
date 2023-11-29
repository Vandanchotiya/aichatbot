import React, { useState } from 'react';
import axios from 'axios';

function ChatComponent() {
  const [userQuery, setUserQuery] = useState('');
  const [botResponse, setBotResponse] = useState('');

  const handleUserQuery = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        userQuery,
      });

      setBotResponse(response.data.response);
    } catch (error) {
      console.error('Error fetching response:', error);
      console.log('Full error object:', error.response);
    }
  };

  return (
    <div>
      <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
      <button onClick={handleUserQuery}>Send</button>
      <div>Bot's Response: {botResponse}</div>
    </div>
  );
}

export default ChatComponent;
