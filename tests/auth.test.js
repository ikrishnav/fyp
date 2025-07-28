const request = require('supertest');
const express = require('express');

// Mock mysql2 and its connection
jest.mock('mysql2', () => {
  const mQuery = jest.fn();
  return {
    createConnection: jest.fn(() => ({
      query: mQuery,
    })),
  };
});
const mysql = require('mysql2');

// Import your router after mocking mysql2
const authRouter = require('../routes/auth'); // Adjust path if needed

const app = express();
app.use(express.json());

// --- MOCK SESSION MIDDLEWARE for tests ---
app.use((req, res, next) => {
  req.session = {}; // Fake session object for testing
  next();
});

app.use('/auth', authRouter);

describe('Login API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fail login with wrong password', async () => {
    mysql.createConnection().query.mockImplementation((sql, params, cb) => {
      cb(null, [{ id: 1, email: 'testuser@gmail.com', password: 'correctpass', is_active: 1, role: 'user' }]);
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'testuser@gmail.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid username or password.');
  });

  it('should fail login if user not found', async () => {
    mysql.createConnection().query.mockImplementation((sql, params, cb) => {
      cb(null, []);
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'doesnotexist@gmail.com', password: 'any' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid username or password.');
  });

  it('should login successfully with correct credentials', async () => {
    mysql.createConnection().query.mockImplementation((sql, params, cb) => {
      cb(null, [{ id: 1, email: 'testuser@gmail.com', password: 'correctpass', is_active: 1, role: 'user' }]);
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'testuser@gmail.com', password: 'correctpass' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('role', 'user');
  });
});
