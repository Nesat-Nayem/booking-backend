const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { router: authRoutes } = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
}); 