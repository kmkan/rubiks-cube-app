// server/index.js

const express = require('express');
const path = require('path'); 
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../client/build')));

app.post('/api/solve', (req, res) => {
  const { solve } = require('kociemba');
  const { faceletString } = req.body;
  if (!faceletString) {
    return res.status(400).json({ error: 'faceletString is required' });
  }
  try {
    const solution = solve(faceletString);
    res.json({ solution });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});