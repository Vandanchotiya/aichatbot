require('dotenv').config();
const express = require('express');

const OpenAI = require('openai');
const app = express();
const cors = require('cors'); 

app.use(express.json());
app.use(cors()); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  const { userQuery } = req.body;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: userQuery }],
      model: 'gpt-3.5-turbo',
    });

    const choices = chatCompletion.choices;
    if (choices && choices.length > 0) {
      const response = choices[0].message.content;
      res.json({ response });
    } else {
      res.status(500).json({ error: 'No valid choices found in the response.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});