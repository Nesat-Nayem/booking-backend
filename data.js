let tenants = [
  {
    id: 'tenant-1',
    name: 'Innovate Corp',
    domain: 'innovatecorp.com',
    settings: { maxBookingHours: 4, bufferMinutes: 15 }
  },
  {
    id: 'tenant-2',
    name: 'Synergy Solutions',
    domain: 'synergysolutions.com',
    settings: { maxBookingHours: 8, bufferMinutes: 30 }
  }
];

let resources = [
  {
    id: 'resource-1',
    tenantId: 'tenant-1',
    name: 'Conference Room A',
    type: 'Meeting Room',
    capacity: 10,
    hourlyRate: 100,
    isActive: true
  },
  {
    id: 'resource-2',
    tenantId: 'tenant-1',
    name: 'Projector',
    type: 'Equipment',
    capacity: 1,
    hourlyRate: 25,
    isActive: true
  },
  {
    id: 'resource-3',
    tenantId: 'tenant-2',
    name: 'Main Hall',
    type: 'Event Space',
    capacity: 100,
    hourlyRate: 250,
    isActive: true
  },
    {
    id: 'resource-4',
    tenantId: 'tenant-2',
    name: 'Focus Booth',
    type: 'Workspace',
    capacity: 1,
    hourlyRate: 50,
    isActive: false
  }
];

let bookings = [
    {
        id: 'booking-1',
        tenantId: 'tenant-1',
        resourceId: 'resource-1',
        userEmail: 'employee@innovatecorp.com',
        userName: 'John Doe',
        startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        attendees: 5,
        status: 'confirmed',
        totalCost: 200,
        createdAt: new Date().toISOString()
    }
];

module.exports = {
  tenants,
  resources,
  bookings
}; 