const express = require('express');
const router = express.Router();
let { tenants, resources, bookings } = require('./data');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('./auth');

// PUBLIC ROUTE
// GET /api/tenants - List all tenants
router.get('/tenants', (req, res) => {
  res.json(tenants.map(t => ({ id: t.id, name: t.name, domain: t.domain })));
});

// Middleware to find tenant
const findTenant = (req, res, next) => {
  const tenant = tenants.find(t => t.id === req.params.tenantId);
  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
  }
  req.tenant = tenant;
  next();
};

// All routes below are now protected
router.use('/:tenantId', authMiddleware, findTenant);

// GET /api/:tenantId/resources - List tenant's resources
router.get('/:tenantId/resources', (req, res) => {
  const tenantResources = resources.filter(r => r.tenantId === req.params.tenantId);
  res.json(tenantResources);
});

// GET /api/:tenantId/bookings - Get tenant's bookings
router.get('/:tenantId/bookings', (req, res) => {
  const tenantBookings = bookings.filter(b => b.tenantId === req.params.tenantId);
  res.json(tenantBookings);
});

// POST /api/:tenantId/bookings - Create new booking
router.post('/:tenantId/bookings', (req, res) => {
    const { resourceId, userEmail, userName, startTime, endTime, attendees } = req.body;
    const { tenant } = req;
    const resource = resources.find(r => r.id === resourceId && r.tenantId === tenant.id);

    if (!resource || !resource.isActive) {
        return res.status(400).json({ message: 'Resource not found or is inactive.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours < 0.5) {
        return res.status(400).json({ message: 'Booking must be at least 30 minutes long.' });
    }

    if (durationHours > tenant.settings.maxBookingHours) {
        return res.status(400).json({ message: `Booking cannot be longer than ${tenant.settings.maxBookingHours} hours.` });
    }

    const bufferMillis = tenant.settings.bufferMinutes * 60 * 1000;
    const overlappingBooking = bookings.find(b => {
        if (b.resourceId !== resourceId) return false;
        const existingStart = new Date(b.startTime).getTime();
        const existingEnd = new Date(b.endTime).getTime();
        const newStart = start.getTime();
        const newEnd = end.getTime();

        return (newStart < existingEnd + bufferMillis && newEnd + bufferMillis > existingStart);
    });

    if (overlappingBooking) {
      // --- Smart Conflict Detector ---
      const suggestions = [];
      let lastEndTime = new Date(overlappingBooking.endTime);
      const durationMillis = end.getTime() - start.getTime();

      while (suggestions.length < 3) {
        // The next potential start time is after the last conflicting booking ends, plus a buffer.
        const suggestionStart = new Date(lastEndTime.getTime() + bufferMillis);
        const suggestionEnd = new Date(suggestionStart.getTime() + durationMillis);

        // Check if this new potential slot conflicts with any booking.
        const conflict = bookings.find(b => {
          if (b.resourceId !== resourceId) return false;
          const existingStart = new Date(b.startTime);
          const existingEnd = new Date(b.endTime);
          
          // A conflict exists if the proposed slot overlaps with an existing booking's reserved time.
          // Reserved time = [existingStart, existingEnd + buffer]
          return suggestionStart < new Date(existingEnd.getTime() + bufferMillis) && suggestionEnd > existingStart;
        });

        if (conflict) {
          // If we hit another conflict, we have to jump our search to the end of that new conflicting booking.
          lastEndTime = new Date(conflict.endTime);
        } else {
          // No conflict, so we found a valid suggestion.
          suggestions.push({
            startTime: suggestionStart.toISOString(),
            endTime: suggestionEnd.toISOString()
          });
          // The next search can start after the slot we just found.
          lastEndTime = suggestionEnd;
        }
      }

      return res.status(409).json({
        message: 'Booking conflict detected. The resource is already booked for the selected time.',
        suggestions
      });
    }
    // --- End of Conflict Detector ---
    
    const totalCost = durationHours * resource.hourlyRate;
    const newBooking = {
        id: `booking-${uuidv4()}`,
        tenantId: tenant.id,
        resourceId,
        userEmail,
        userName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendees,
        status: 'confirmed',
        totalCost,
        createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    res.status(201).json(newBooking);
});


// DELETE /api/:tenantId/bookings/:id - Cancel booking
router.delete('/:tenantId/bookings/:id', (req, res) => {
  const { id } = req.params;
  const bookingIndex = bookings.findIndex(b => b.id === id && b.tenantId === req.tenant.id);

  if (bookingIndex === -1) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  bookings.splice(bookingIndex, 1);
  res.status(204).send();
});

module.exports = router; 