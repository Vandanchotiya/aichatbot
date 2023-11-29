import React, { useState } from 'react';

const Chat = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSubmit = async () => {
        // Send the user query to the server
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        const data = await response.json();
        setResponse(data.response);
    };

    return (
        <div>
            <input type="text" value={query} onChange={handleQueryChange} />
            <button onClick={handleSubmit}>Submit</button>
            <div>
                <strong>Response:</strong> {response}
            </div>
        </div>
    );
};

export default Chat;