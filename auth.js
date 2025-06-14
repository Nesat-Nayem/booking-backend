const express = require('express');
const jwt = require('jsonwebtoken');
const { users, tenants } = require('./data');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-env';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  // In a real app, use bcrypt.compare(password, user.password)
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const tenant = tenants.find(t => t.id === user.tenantId);
  if (!tenant) {
    return res.status(401).json({ message: 'User is not associated with a valid tenant.' });
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    tenant
  });
});

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // Adds { userId, tenantId, email } to the request object
        
        // Ensure the token's tenantId matches the URL's tenantId
        if (req.params.tenantId && req.user.tenantId !== req.params.tenantId) {
          return res.status(403).json({ message: 'Forbidden: You do not have access to this tenant' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { router, authMiddleware };
