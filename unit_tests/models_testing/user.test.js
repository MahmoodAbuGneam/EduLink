const mongoose = require('mongoose');
const User = require('../../models/User.js'); 
const dbHandler = require('../config/dbHandler.js'); 

beforeAll(async () => await dbHandler.connect(), 5000); 
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase(), 5000);

describe('User Model Test', () => {
  it('can create a user', async () => {
    const userData = { username: 'username', email: 'test@example.com' };
    const user = new User({
        email: "test@example.com",
        username: "username",
        password: "password123",
        passwordConf: "password123",
        role: "student",
    });
    await user.save();

    const foundUser = await User.findOne({ email: 'test@example.com' });
    expect(foundUser.username).toEqual(userData.username);
  }, 5000);
} );



