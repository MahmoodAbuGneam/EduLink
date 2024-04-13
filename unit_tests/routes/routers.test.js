const session = require('express-session');
const request = require('supertest');
const express = require('express');
const router = require('../../routes/index'); 
const dbHandler = require('../config/dbHandler'); 
const ejs = require('ejs');
// define path
const path = require('path')
const user = require('../../models/user');

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');



const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'test secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));



app.use('/', router); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

beforeAll(async () => await dbHandler.connect(), 10000);
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase(), 10000);



async function createUser(userData) {
    const user = new User(userData);
    await user.save();
    return user.toObject(); // Convert to a plain JavaScript object to easily access its properties
}


// function to mimick a login session for user
async function loginUser(credentials) {
    const res = await request(app)
        .post('/login')
        .send(credentials);
    return res.headers['set-cookie'];
}






describe('User Routes', () => {




    // register router 

    describe('POST /register', () => {
        it('registers a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                passwordConf: 'password123',
            };

            const response = await request(app)
                .post('/register') 
                .send(userData)
                .expect(200); 

            
            expect(response.body).toHaveProperty('Success', 'You are registered, You can login now.');
            });



            it('returns an error when required fields are missing', async () => {
                const response = await request(app)
                    .post('/register')
                    .send({
                        // Intentionally missing fields
                        email: 'testuser@example.com',
                        password: 'password123',
                        // username and passwordConf are missing
                    })
                    .expect(400);
            
                expect(response.body).toHaveProperty('Error', 'All fields are required');
            });
            
            it('returns an error when passwords do not match', async () => {
                const response = await request(app)
                    .post('/register')
                    .send({
                        email: 'testuser@example.com',
                        username: 'testuser',
                        password: 'password123',
                        passwordConf: 'differentpassword123',
                    })
                    .expect(400);
            
                expect(response.body).toHaveProperty('Error', 'Passwords do not match');
            });
            
            
            
    
            it('returns an error for already registered email', async () => {
                // Setup: create a user with the email we'll test
                await createUser({
                    email: 'testuser@example.com',
                    username: 'existinguser',
                    password: 'password123',
                    passwordConf: 'password123',
                });
            
                // Attempt to register with the same email
                const response = await request(app)
                    .post('/register')
                    .send({
                        email: 'testuser@example.com',
                        username: 'testuser',
                        password: 'password123',
                        passwordConf: 'password123',
                    })
                    .expect(400);
            
                expect(response.body).toHaveProperty('Error', 'Email is already used.');
            });
    
    
            it('returns an error for already taken username', async () => {
                // Setup: create a user with the username we'll test
                await createUser({
                    email: 'uniqueemail@example.com',
                    username: 'testuser',
                    password: 'password123',
                    passwordConf: 'password123',
                });
            
                // Attempt to register with the same username
                const response = await request(app)
                    .post('/register')
                    .send({
                        email: 'newemail@example.com',
                        username: 'testuser', // Same username
                        password: 'password123',
                        passwordConf: 'password123',
                    })
                    .expect(400);
            
                expect(response.body).toHaveProperty('Error', 'Username is already taken.');
            });

         });

         
        // login router

        describe('POST /login', () => {

            it('successfully logs in with correct credentials', async () => {
                await createUser({
                    email: 'user@example.com',
                    password: 'password123', // Consider using hashed passwords in your actual implementation
                    isAdmin: false,
                    isVerified: true,
                    role: 'student',
                });
            
                const response = await request(app)
                    .post('/login')
                    .send({ email: 'user@example.com', password: 'password123'})
                    .expect(200); // Assuming a 200 status code for successful login
            
                expect(response.body).toEqual({
                    loginSuccess: true,
                    isVerified: true,
                    isAdmin: false,
                    role: 'student',
                });
            });

            it('fails to log in with an unregistered email', async () => {
                const response = await request(app)
                    .post('/login')
                    .send({ email: 'nonexistent@example.com', password: 'password123' })
                    .expect(200); // Assuming the route responds with 200 OK even on login failure for security reasons
            
                expect(response.body).toEqual({
                    loginSuccess: false,
                    message: "This Email Is not registered",
                });
            });

            it('fails to log in with incorrect password', async () => {
                await createUser({
                    email: 'user@example.com',
                    password: 'correctpassword',
                    isAdmin: false,
                    isVerified: true,
                    role: 'student',
                });
            
                const response = await request(app)
                    .post('/login')
                    .send({ email: 'user@example.com', password: 'wrongpassword' })
                    .expect(200); // Assuming the route responds with 200 OK even on login failure
            
                expect(response.body).toEqual({
                    loginSuccess: false,
                    message: "Login failed. Please check your credentials.",
                });
            });










        } );



        describe('Profile Route', () => {


            it('successfully accesses profile for authenticated and verified user', async () => {
                await createUser({
                    email: 'user@example.com',
                    username: 'testuser',
                    password: 'password123',
                    isVerified: true
                });
        
                const cookie = await loginUser({ email: 'user@example.com', password: 'password123' });
        
                const response = await request(app)
                    .get('/profile')
                    .set('Cookie', cookie)
                    expect(response.text).toMatch(/Welcome, testuser!/); // Verify username is displayed
                    expect(response.text).toMatch(/user@example.com/); // Verify email is displayed

            });
        
            
            it('redirects unauthenticated user to login page', async () => {
                const response = await request(app)
                    .get('/profile')
                    .expect(302); 
        
                expect(response.headers.location).toBe('/login'); 
            });


            it('redirects unverified user to document upload page', async () => {

                await createUser({
                    email: 'unverified@example.com',
                    username: 'unverifiedUser',
                    password: 'password123',
                    isVerified: false // Not verified
                });
        
                //login with the non-verified user 
                const cookie = await loginUser({ email: 'unverified@example.com', password: 'password123' });
        
                const response = await request(app)
                    .get('/profile')
                    .set('Cookie', cookie)
                    .expect(302); 
        
                expect(response.headers.location).toBe('/upload-docs'); // Verifies redirect to document upload page
            });



        });

        

        describe('Logout Route', () => {
            it('successfully logs out the user and redirects to login page', async () => {
                await createUser({
                    email: 'loggedin@example.com',
                    password: 'password123', 
                });
        
                const cookie = await loginUser({ email: 'loggedin@example.com', password: 'password123' });
        
                const response = await request(app)
                    .post('/logout')
                    .set('Cookie', cookie)
                    .expect(302);
        

                expect(response.headers.location).toBe('/login');
            });
        
        });


        describe('Forgot Password Route', () => {
            it('sends a reset link for registered email', async () => {
                const userEmail = 'test@example.com';
                await createUser({
                    email: userEmail,
                    password: 'password123',
                });
        

                nodemailer.createTransport.mockReturnValue({
                    sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
                        callback(null, { response: 'Email sent' });
                    })
                });
        
                const response = await request(app)
                    .post('/forgot-password')
                    .send({ email: userEmail })
                    .expect(200);
        
                expect(response.body).toHaveProperty('message', 'The reset link has been sent to your email.');
                expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
            });
        

            it('returns an error for non-registered email', async () => {
                const nonRegisteredEmail = 'nonexistent@example.com';
                const response = await request(app)
                    .post('/forgot-password')
                    .send({ email: nonRegisteredEmail })
                    .expect(404);
        
                expect(response.body).toHaveProperty('message', 'This email is not registered.');
            });
        
        });


        describe('Profile Route - Unverified User', () => {
            it('redirects unverified user to document upload page', async () => {
 
                await createUser({email: 'unverified@example.com', username: 'unverifiedUser', password: 'password123', isVerified: false});
                const cookie = await loginUser({email: 'unverified@example.com', password: 'password123'});
        
                const response = await request(app).get('/profile').set('Cookie', cookie).expect(302);
                expect(response.headers.location).toBe('/upload-docs');
            });
        });


        describe('Submit Docs Route', () => {
            it('uploads a document successfully', async () => {
                const cookie = await loginUser({email: 'user@example.com', password: 'password123'});
        
                const response = await request(app)
                    .post('/submit-docs')
                    .set('Cookie', cookie)
                    .attach('document', Buffer.from('fake file content'), 'testdoc.txt')
                    .expect(200);
        
                expect(response.text).toContain("File uploaded successfully.");
            });
        });







        describe('Admin Panel Access Route', () => {

            let adminUser;
            let adminCookie;

            beforeAll(async () => {
                adminUser = await createUser({
                    email: 'admin@example.com',
                    username: 'AdminUser',
                    password: 'adminPassword',
                    isAdmin: true,
                    isVerified: true
                });
                
                adminCookie = await loginUser({
                    email: 'admin@example.com',
                    password: 'adminPassword',
                    isAdmin: true,
                    isVerified: true
                });
            });
            

            it('redirects to login page for non-verified in users', async () => {
                await createUser({
                    email: 'unverified1@example.com',
                    username: 'unverifiedUser1',
                    password: 'password123',
                    isVerified: false // Not verified
                });

                const cookie = await loginUser({ email: 'unverified1@example.com', password: 'password123' });
                const response = await request(app)
                    .get('/admin-panel')
                    .set('Cookie', cookie)
        
                expect(response.headers.location).toBe('/profile');
            }); 
        
            it('displays welcome message to authenticated admin user', async () => {
                 
                let adminUser1;
                let adminCookie1;

                adminUser1 = await createUser({
                    email: 'admin1@example.com',
                    username: 'AdminUser1',
                    password: 'adminPassword1',
                    isAdmin: true,
                    isVerified: true
                });
                
                adminCookie1 = await loginUser({
                    email: 'admin1@example.com',
                    password: 'adminPassword1',
                    isAdmin: true,
                    isVerified: true
                });

                const response = await request(app)
                    .get('/admin-panel')
                    .set('Cookie', adminCookie1);

                // expect the url to be /admin-panel
            });
        
            it('redirects non-admin user to profile page', async () => {

                await createUser({
                    email: 'nonAdmin@example.com',
                    username: 'nonAdminUser',
                    password: 'user123',
                    isVerified: true,
                    isAdmin: false
                });
                const userCookie = await loginUser({ email: 'nonAdmin@example.com', password: 'user123', isAdmin : false, isVerified: true });
        
                const response = await request(app)
                    .get('/admin-panel')
                    .set('Cookie', userCookie)
                    .expect(302);
        
                expect(response.headers.location).toBe('/profile');
            });
        });





}); //end of describe block
