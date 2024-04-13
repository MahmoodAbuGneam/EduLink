const request = require('supertest');
const app = require('../../server.js'); 
const dbHandler = require('../config/dbHandler.js'); 

const User = require('../../models/user.js'); 

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('User Search', () => {
    let user;
  
    beforeEach(async () => {
      user = new User({
        username: 'existinguser',
        isVerified: true,
        role: 'student',
        email: 'existinguser@email.com',
        password: 'password',
      });
      await user.save();
    });
  
    it('should redirect to the user profile if the user exists', async () => {
      const username = 'existinguser';
      const response = await request(app)
        .get(`/search-users?username=${username}`) // Adjust according to how the search is triggered
        .expect(302); // Expecting a redirection status code
  
      expect(response.headers.location).toBe(`/users/${username}`);
    });
  
    it('should return a 404 if the user does not exist', async () => {
      const username = 'nonexistinguser123 ';
      const response = await request(app)
        .get(`/search-users?username=${username}`)
        .expect(302);
    });
  });
