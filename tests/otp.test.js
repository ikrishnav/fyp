const request = require('supertest');
const express = require('express');
jest.mock('mysql2', () => {
  const mQuery = jest.fn();
  return {
    createConnection: jest.fn(() => ({
      query: mQuery,
    })),
  };
});
const mysql = require('mysql2');
const authRouter = require('../routes/auth');

const app = express();
app.use(express.json());
// Fake session for completeness
app.use((req, res, next) => { req.session = {}; next(); });
app.use('/auth', authRouter);

describe('OTP/Password Reset API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send OTP email if user exists', async () => {
    // Mock update to succeed
    mysql.createConnection().query.mockImplementationOnce((sql, params, cb) => cb(null));
    // Mock sendMail to succeed (you can mock nodemailer for full isolation, but keep it simple for now)

    const res = await request(app)
      .post('/auth/send-otp')
      .send({ email: 'testuser@gmail.com' });
    // Expect a redirect (as in your code)
    expect(res.statusCode).toBe(302);
    // Or: expect(res.headers.location).toContain('/views/reset.html?email=testuser@gmail.com');
  });

  it('should reset password with correct OTP', async () => {
    // First query: select OTP
    mysql.createConnection().query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ otp: 123456 }]))
      // Second query: update password
      .mockImplementationOnce((sql, params, cb) => cb(null));

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: 'testuser@gmail.com', otp: 123456, new_password: 'newpass123' });
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('success');
  });

  it('should fail reset with invalid OTP', async () => {
    mysql.createConnection().query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ otp: 654321 }]));

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: 'testuser@gmail.com', otp: 123456, new_password: 'newpass123' });
    expect(res.statusCode).toBe(400);
    expect(res.text).toBe('Invalid OTP');
  });
});
