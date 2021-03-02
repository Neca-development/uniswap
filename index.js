require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ extended: true }));
app.use('/api', require('./routes/api.routes'));

app.get('*', (req, res) => {
  res.json({message: 'nothing to view'});
});

async function start() {
  try {
    app.listen(PORT, () => console.log(`Started on ${PORT}`));
  } catch (e) {
    console.log('Error', e.message);
    process.exit(1);
  }
}

start();

require('./test.js');