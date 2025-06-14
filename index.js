const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { router: authRoutes } = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Multi-tenant Booking API is running!' });
});

// For Vercel, we need to export the app
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
  });
}
