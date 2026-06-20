const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Bill = require('../models/Bill');
const MeterReading = require('../models/MeterReading');

let mongoServer;
let token;
let user;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);

  // Create test user and token
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usage Test',
      email: 'usage@test.com',
      password: 'password123',
    });
  token = res.body.token;
  user = res.body;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Bill.deleteMany({});
  await MeterReading.deleteMany({});
});

describe('Usage Endpoints', () => {
  describe('GET /api/usage/summary calculation logic', () => {
    it('should return empty state when no bills exist', async () => {
      const res = await request(app)
        .get('/api/usage/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.hasData).toBe(false);
    });

    it('should return summary correctly when bill and reading exist', async () => {
      // Create a bill from 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const bill = await Bill.create({
        userId: user._id,
        imageUrl: 'http://example.com/bill.jpg',
        currentReading: 1000,
        unitsConsumed: 200,
        totalAmount: 10000,
        perUnitRate: 50, // 10000 / 200
        createdAt: tenDaysAgo,
      });

      // Create a meter reading for today
      await MeterReading.create({
        userId: user._id,
        billId: bill._id,
        imageUrl: 'http://example.com/meter.jpg',
        reading: 1150, // 150 units consumed since last bill
        confidence: 'high',
      });

      const res = await request(app)
        .get('/api/usage/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.hasData).toBe(true);
      expect(res.body.hasReading).toBe(true);
      
      // Calculate expected numbers
      expect(res.body.unitsUsedSinceBill).toBe(150); // 1150 - 1000
      expect(res.body.daysSinceBill).toBe(10); // 10 days ago
      expect(res.body.dailyAverage).toBeCloseTo(15); // 150 / 10
      expect(res.body.projectedMonthlyUnits).toBeCloseTo(450); // 15 * 30
      expect(res.body.estimatedCost).toBeCloseTo(22500); // 450 * 50
    });

    it('should return no-reading state if bill exists but no readings', async () => {
      await Bill.create({
        userId: user._id,
        imageUrl: 'http://example.com/bill.jpg',
        currentReading: 1000,
        unitsConsumed: 200,
        totalAmount: 10000,
        perUnitRate: 50,
      });

      const res = await request(app)
        .get('/api/usage/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.hasData).toBe(true);
      expect(res.body.hasReading).toBe(false);
      expect(res.body.perUnitRate).toBe(50);
    });
  });
});
