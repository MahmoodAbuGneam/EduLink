const request = require('supertest');
const app = require('../../server.js'); 
const dbHandler = require('../config/dbHandler.js'); 



beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('POST /report-problem', () => {
  it('should save the report and return a success message', async () => {
    const reportData = {
      email: 'user@example.com',
      content: 'This is a test report.'
    };

    const response = await request(app)
      .post('/report-problem')
      .send(reportData)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toEqual('Report submitted successfully');
  });

  it('should handle errors gracefully', async () => {
    const reportData = {
      email: 'user@example.com',
      content: '' // Assuming content is required, sending an empty content to trigger error
    };

    const response = await request(app)
      .post('/report-problem')
      .send(reportData)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body.message).toEqual('Error submitting report');
  });
});