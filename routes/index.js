var express = require('express');
var router = express.Router();
var User = require('../models/user');
const jwt = require('jsonwebtoken');
const Post = require('../models/post');
const PostImage = require('../models/postImage');
const Report = require('../models/report'); 
const JobPost = require('../models/jobPost');
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID = '705639256411-n2f9qumeospovv7tkhckbrm1siqtotf6.apps.googleusercontent.com'
const  CLIENT_SECRET = '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'
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'
const REFRESH_TOKEN = '1//04k4QfMw8tpmYCgYIARAAGAQSNwF-L9Ir5s4w5-8szpUblGkmJpPNMH43cV3znORTz2QloRXSk7cm9IJT0YhbHZcJNYh30ZiAiXg'

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

const multer = require('multer');
const storage = multer.memoryStorage(); // Use memoryStorage
const upload = multer({ storage: storage, limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB file limit

const File = require('../models/file'); // Adjust the path as necessary
const fs = require('fs');


const Note = require('../models/note');
const Workshop = require('../models/Workshop'); 







router.get('/', function (req, res, next) {
    const testimonials = [
        {
            name: "Hasan Ajaj",
            role: "Computer Science Major",
            quote: "EduLink has been a game-changer for my academic career. The workshops I've attended have not only helped me ace my courses but also prepared me for the tech industry. Plus, I landed a fantastic part-time job through the site that works perfectly with my class schedule."
        },
        {
            name: "Zedan Nsasra",
            role: "HR Manager, Tech Innovations Inc.",
            quote: "We've been using EduLink to find part-time employees among students, and the experience has been outstanding. The students we've hired are not only skilled but also eager to learn. It's great to see a platform that effectively connects employers with talented students."
        },
        {
            name: "Dr. Hamza Sholdom",
            role: "Professor of Economics",
            quote: "EduLink has allowed me to reach students beyond the classroom through workshops focused on applied economics. It's rewarding to see students engage and apply these concepts in real-world scenarios. This platform has truly bridged the gap between academic knowledge and practical application."
        }
    ];
    res.render('home.ejs', { testimonials: testimonials });
})




router.get('/register', function (req, res, next) {
    return res.render('register.ejs');
});



router.post('/register', async function(req, res, next) {
    try {
        console.log(req.body);
        var personInfo = req.body;

        if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
            return res.status(400).send({"Error": "All fields are required"});
        }

        if (personInfo.password !== personInfo.passwordConf) {
            return res.status(400).send({"Error": "Passwords do not match"});
        }

        // Check if the email or username is already registered
        const existingEmail = await User.findOne({ email: personInfo.email });
        if (existingEmail) {
            return res.status(400).send({"Error": "Email is already used."});
        }

        const existingUsername = await User.findOne({ username: personInfo.username });
        if (existingUsername) {
            return res.status(400).send({"Error": "Username is already taken."});
        }

        // Create a new user instance
        const newUser = new User({
            email: personInfo.email,
            username: personInfo.username,
            password: personInfo.password,
            passwordConf: personInfo.passwordConf,
            role: personInfo.role,
        });

        // Save the new user to the database
        await newUser.save();

        return res.status(200).send({"Success": "You are registered, You can login now."});
    } catch (error) {
        // Handle any errors
        console.error(error);
        return res.status(500).send({"Error": "Error registering user"});
    }
});



router.get('/login', function (req, res, next) {

    return res.render('login.ejs');
});





router.post('/login', async function (req, res, next) {
    try {
        var email = req.body.email;
        var password = req.body.password;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.json({ loginSuccess: false, message: "This Email Is not registered" });
        }
        
        if (user.password === password) {
            req.session.currentUser = {
                _id: user._id,
                isAdmin: user.isAdmin,
                role: user.role
            };
            req.session.userId = user._id; 
            req.session.isAdmin = user.isAdmin;
            req.session.role = user.role; 
            return res.json({ loginSuccess: true, isVerified: user.isVerified, isAdmin: user.isAdmin, role: user.role });
        } else {
            return res.json({ loginSuccess: false, message: "Login failed. Please check your credentials." });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({"Error": "Internal server error"});
    }
});



router.get('/profile', async function (req, res, next) {
    console.log("Profile route accessed.");
    
    // Retrieve the user ID from the session
    const userId = req.session.userId;
    console.log("User ID:", userId); // Log user ID
    
    // Check if the user is authenticated (logged in)
    if (!userId) {
        console.log("User not authenticated. Redirecting to login page.");
        // If not authenticated, redirect to the login page
        return res.redirect('/login');
    }
    
    try {
        // If authenticated, find the user in the database
        const user = await User.findOne({ _id: userId });

        if (!user) {
            // If user not found, redirect to the login page
            console.log("User not found. Redirecting to login page.");
            return res.redirect('/login');
        }
        console.log(user.isVerified);
        if (user.isVerified === false) {
            return res.redirect('/upload-docs');
        }
        // If user found, render the profile page with user data
        console.log("User found:", user);
        return res.render('profile.ejs', { username: user.username, isAdmin: user.isAdmin ? true : false, email: user.email, isLoggedIn: req.session.userId ? true : false });
    } catch (error) {
        // Handle any errors
        console.error("Error finding user:", error);
        return res.status(500).send({"Success": "Internal server error"});
    }
});

router.post('/logout', function(req, res, next) {
    // Destroy the session to logout the user
    req.session.destroy(function(err) {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out');
        }
        // Redirect the user to the login page after logout
        res.redirect('/login');
    });
});




// FORGOT PASSWORD THINGIES


const JWT_SECRET = process.env.JWT_SECRET;

router.get('/forgot-password', (req, res, next) => {
    res.render('forgot-password.ejs');
  });

  
router.post('/forgot-password', async (req, res, next) => {
    const {email} = req.body;
    // check if the user exists in the database
    const user = await User.findOne({ email: email });
    if (!user) {
        res.status(404).json({ message: "This email is not registered." });
        return;
    }

    // User exists, now create a one-time link valid for 15 minutes
    const secret = JWT_SECRET + user.password;
    const payload = {
        email: user.email,
        id: user._id
    };
   
    const token = jwt.sign(payload, secret, {expiresIn: '15m'});
    const link = `http://localhost:65532/reset-password/${user._id}/${token}`;

    // Setup email transport and send the email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'mahmoab13@ac.sce.ac.il', // Replace with your email
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: await oAuth2Client.getAccessToken() // Assuming oAuth2Client is configured
        }
    });

    const mailOptions = {
        from: 'mahmoab13@ac.sce.ac.il', // Replace with your email
        to: user.email,
        subject: 'Password Reset Request',
        html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f4f4f4; }
            .container { background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { background-color: #007bff; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            h2 { color: #444; }
            p { margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>You recently requested to reset your password for your account. Use the button below to reset it. <strong>This password reset is only valid for the next 15 minutes.</strong></p>
            <a href="${link}" class="button">Reset your password</a>
            <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
            <p>Thanks,<br>@EduLink</p>
        </div>
    </body>
    </html>
    `
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'The reset link has been sent to your email.' });
        }
    });
});


router.get('/reset-password/:id/:token', async (req, res, next) => {
    const { id, token } = req.params;
    
    try {
        // Attempt to find the user by ID
        const user = await User.findById(id);
        if (!user) {
            res.send("Invalid ID");
            return;
        }
        
        const secret = JWT_SECRET + user.password;
        // Verify the token
        const payload = jwt.verify(token, secret);
        // Render some page or return some data
        res.render('reset-password.ejs', {
            email: 'the email address',
            id: req.params.id,
            token: req.params.token,
            isLoggedIn: req.session.userId ? true : false
        });
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});


router.post('/reset-password/:id/:token', async (req, res, next) => {
    const { id, token } = req.params;
    const { password, password2 } = req.body;

    if (password !== password2) {
        return res.send("Passwords do not match");
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.send("Invalid ID");
        }

        console.log("User found:", user.email); // Debugging

        const secret = JWT_SECRET + user.password;
        const payload = jwt.verify(token, secret);

        console.log("Payload verified for user:", payload.email); // Debugging

        user.password = password;
        await user.save();


        console.log("Password updated in database for user:", user.email); // Debugging

        return res.send("Password reset successful");
    } catch (error) {
        console.error("Error during password reset:", error);
        return res.send("Failed to reset password due to an error.");
    }
});




// FILE UPLOADING SYSTEM <3



router.get('/upload-docs', async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login'); 
    }

    try {

        const userDocuments = await File.find({ userId: req.session.userId });
        res.render('upload-docs', {
            userId: req.session.userId,
            isLoggedIn: !!req.session.userId,
            documents: userDocuments 
        });
    } catch (error) {
        console.error("Error fetching user's documents:", error);
        res.status(500).send("Error fetching documents.");
    }
});




router.post('/submit-docs', upload.single('document'), async (req, res) => {
    const { mimetype, originalname } = req.file;
    const userId = req.session.userId; // Assuming you store the logged-in user's ID in the session

    // Create a new file document
    const newFile = new File({
        userId: userId,
        filename: originalname,
        contentType: mimetype,
        fileData: req.file.buffer // Directly use buffer from memory storage
    });

    // Save the file document to MongoDB
    try {
        await newFile.save();
        res.send("File uploaded successfully.");
    } catch (error) {
        console.error("Error saving file to database:", error);
        res.status(500).send("Error uploading file.");
    }
});



router.delete('/delete-doc/:docId', async (req, res) => {
    const { docId } = req.params;

    try {
        // Attempt to find and delete the document
        const result = await File.findByIdAndDelete(docId);

        if (!result) {
            // If no document was found and deleted, send a 404 response
            return res.status(404).json({ message: 'Document not found' });
        }

        // If the deletion was successful, send a confirmation response
        res.json({ message: 'Document successfully deleted' });
    } catch (error) {
        console.error('Error deleting document:', error);
        // Send a 500 response if an error occurred during the operation
        res.status(500).json({ message: 'Error deleting document' });
    }
});







//ADMIN PANEL 


router.get('/admin-panel', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); 
    }

    try {
        const user = await User.findById(req.session.userId);
        if (user && user.isAdmin) {
            res.render('admin-panel', { 
                username: user.username, 
                email: user.email,
                isLoggedIn: req.session.userId ? true : false
            });
        } else {
            // If not admin, redirect to a different page or show an error
            res.redirect('/profile'); 
        }
    } catch (error) {
        console.error("Error loading admin panel:", error);
        res.status(500).send("Internal server error");
    }
});


router.get('/admin/users', async (req, res) => {


        if (!req.session.isAdmin) {
          return res.status(403).send('Access denied');
        }
        const users = await User.find();
        res.render('admin-users', { users,isLoggedIn: req.session.userId ? true : false });
      });


      




//DELETE USER IN MANAGE USERS - ADMIN PANEL 

router.get('/admin/delete-user/:userId', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Access denied. You must be an admin to delete users.');
    }

    try {
        await User.findByIdAndDelete(req.params.userId);
        res.redirect('/admin/users');  // Redirect back to the admin users list page
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Failed to delete user due to an internal error.");
    }
});



router.get('/admin/edit-user/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Access denied');
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const userRole = user.role;
        res.render('edit-user', { user, userRole, isLoggedIn: req.session.userId ? true : false });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send("Internal server error");
    }
});


router.post('/admin/update-user/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email, role , isVerified} = req.body;
    if (!req.session.isAdmin) {
        return res.status(403).send('Access denied');
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            email: req.body.email,
            username: req.body.username,
            role: req.body.role,
            isVerified: req.body.isVerified,
        }, { new: true });
        console.log(req.body); // This should show the role being submitted

        // Redirect back to the users list or to a success page
        res.redirect('/admin/users'); 
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send("Internal server error");
    }
});





// Viewing Files of the user - ADMIN PANEL 

router.get('/admin/view-files/:userId', async (req, res) => {
    if (!req.session.isAdmin) {
      return res.status(403).send('Access Denied');
    }
  
    try {
      const userId = req.params.userId;
      const files = await File.find({ userId: userId }); // Assuming File is your file model
  
      res.render('admin-view-files', { files,isLoggedIn: req.session.userId ? true : false }); // Render a new template with the files
    } catch (error) {
      console.error("Error fetching user's files:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  




router.get('/files/download/:fileId', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const file = await File.findById(fileId); // Assuming File is your file model
  
      if (!file) {
        return res.status(404).send('File not found');
      }

  
      // Set the headers to indicate a file download
      res.setHeader('Content-Disposition', 'attachment; filename=' + file.filename);
      res.setHeader('Content-Type', file.contentType);
  
      // Send the file data as the response
      res.send(file.fileData);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  




  router.delete('/admin/delete-file/:fileId', async (req, res) => {
    if (!req.session.isAdmin) {
      return res.status(403).json({ message: 'Access Denied' });
    }
  
    try {
      const fileId = req.params.fileId;
      await File.findByIdAndDelete(fileId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
});

//Main page 

router.get('/main', async (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        // Redirect to login page if not logged in
        return res.redirect('/login');
    }

    try {
        // Fetch all posts and populate the 'userId' field to get the user details for each post
        const posts = await Post.find()
                                .populate('userId') // Assuming you want to display the username and perhaps use isAdmin and role for conditional rendering in the EJS
                                .sort({ createdAt: -1 });

        const currentUser = {
            _id: req.session.userId,
            isAdmin: req.session.isAdmin,
            role: req.session.role
        };

        // Render 'main-page' with posts and current user information
        res.render('main-page', {
            posts,
            currentUser,
            isLoggedIn: !!req.session.userId // Simplified truthy check for logged in status
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        // Optionally, handle the error more gracefully in your application context
        res.status(500).send('Error loading the page');
    }
});




router.post('/submit-post', upload.single('postImage'), async (req, res) => {
    const { postContent } = req.body; // Text content
    const userId = req.session.userId;
    console.log(userId);
    try {
        let postImage;
        if (req.file) {
            // Create a new PostImage document with the image from the request
            postImage = new PostImage({
                img: req.file.buffer,
                contentType: req.file.mimetype
            });
            await postImage.save();
        }


        const newPost = new Post({
            content: postContent,
            userId: userId,
            image: postImage ? postImage._id : null
        });

        await newPost.save();
        res.redirect('/main'); 
    } catch (error) {
        console.error("Failed to submit post:", error);
        res.status(500).send("Error submitting post.");
    }
});



// Example of a route to delete a post
router.post('/delete-post/:postId', async (req, res) => {
    const { postId } = req.params;
    const currentUser = req.session.currentUser; // Ensure this matches your session setup

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Check if the current user is allowed to delete the post
        if (currentUser.isAdmin || post.userId.toString() === currentUser._id.toString()) {
            // If there's an image associated with the post, delete it
            if (post.image) {
                await PostImage.findByIdAndRemove(post.image);
            }
            // Now delete the post
            await Post.findByIdAndRemove(postId);
            res.redirect('/main'); 
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send("An error occurred");
    }
});


router.get('/post-image/:id', async (req, res) => {
    try {
        const image = await PostImage.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }
        res.set('Content-Type', image.contentType);
        res.send(image.img);
    } catch (error) {
        console.error("Error serving image:", error);
        res.status(500).send("Error serving image");
    }
});





router.get('/chat', async (req, res) => {
    if (!req.session.userId) {
        console.log('Redirecting to login: No userId in session');
        return res.redirect('/login'); 
    }

    try {
        // Assuming you have a User model and the user's ID is stored in req.session.userId when they log in
        const user = await User.findById(req.session.userId);

        if (!user) {
            console.log('Redirecting to login: User not found');
            return res.redirect('/login'); 
        }

        if (!user.isVerified) {
            console.log('User not verified');
            // Redirect to a verification notice page or send back a verification message
            return res.send("Your account is not verified. Please verify your account.");
        }

        console.log('Rendering chat');
        // Pass the username to the chat template
        res.render('chat', { username: user.username,isLoggedIn: req.session.userId ? true : false }); // Render the chat page for verified users with the username
    } catch (error) {
        console.error("Error accessing chat page:", error);
        res.status(500).send("Internal server error while accessing chat page.");
    }
});







router.post('/send-private-message', async (req, res) => {
    
    try {
        

    const senderId = req.session.userId; // Get the sender's user ID from session
    const recipientUsername = req.body.recipientUsername;
    const messageContent = req.body.messageContent;
    
    // Find the recipient user by their username
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).send('Recipient not found');
    }
    
    // Create and save the private message
    const privateMessage = new PrivateMessage({
      content: messageContent,
      sender: senderId,
      recipient: recipient._id
    });
    await privateMessage.save();
    
    res.send('Message sent successfully');









    } catch (error) {
        console.error("Error sending private message:", error);
        res.status(500).send("Server Error");
    }
    
    
    
    
    
});




router.get('/fetch-received-messages/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const messages = await PrivateMessage.find({ recipient: userId })
            .populate('sender', 'username')
            .populate('recipient', 'username');
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});




router.get('/search-posts', async (req, res) => {
    const searchQuery = req.query.query;
    try {
        const posts = await Post.find({
            $text: { $search: searchQuery }
        }).lean();

        res.render('main-page', {
            posts: posts,
            isLoggedIn: !!req.session.userId, 
            currentUser: {
                _id: req.session.userId, // Assuming userId is stored in session upon login
                isAdmin: req.session.isAdmin // Assuming isAdmin flag is set in session upon login
            }
        });
    } catch (error) {
        console.error("Error searching posts:", error);
        res.status(500).send("Error performing search");
    }
});







// CALENDAR NOTES 

router.get('/notes-for-date/:date', async (req, res) => {
    const { date } = req.params;
    const notes = await Note.find({ date: date }).exec();
    res.json(notes);
});



router.delete('/delete-note/:id', async (req, res) => {
    try {
        const noteId = req.params.id;
        // Add authentication checks here as necessary
        await Note.findByIdAndDelete(noteId);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Failed to delete note:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/save-note', async (req, res) => {
    try {
        const { date, content } = req.body;
        const userId = req.session.userId; // Ensure you have user session management set up to access this

        if (!userId) {
            return res.status(403).send("User not authenticated");
        }

        const newNote = new Note({
            date: date,
            content: content,
            user: userId // Linking the note to the user's ID
        });

        await newNote.save();
        res.send({ message: 'Note saved successfully' });
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).send('Error saving note');
    }
});




router.post('/report-problem', async function(req, res) {
    try {
      const { content, email } = req.body;
      const newReport = new Report({ content, email });
      await newReport.save();
      res.json({ message: 'Report submitted successfully' });
    } catch (error) {
      console.error('Error submitting report:', error);
      res.status(500).json({ message: 'Error submitting report' });
    }
  });









  //! JOB POSTING 


  router.post('/job-posts', async (req, res) => {
    try {
        const { title, description, requirements, company, location, applicationLink } = req.body;
        const postedBy = req.session.userId; // Assuming you have user authentication and store the userId in session

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newJobPost = new JobPost({
            title,
            description,
            requirements,
            company,
            location,
            applicationLink,
            postedBy // Make sure this matches a valid ObjectId from your User collection
        });

        await newJobPost.save();

        const jobPostWithUsername = {
            ...newJobPost.toObject(),
            username: user.username // Adjust 'username' to your actual field name in the User model
        };


        res.status(201).json(jobPostWithUsername);
    } catch (error) {
        console.error("Error creating job post:", error);
        res.status(500).json({ message: "Failed to create job post", error: error.toString() });
    }
});

router.get('/job-posts', async (req, res) => {
    if (!req.session.userId) {
        console.log("User not authenticated. Redirecting to login page.");
        return res.redirect('/login');
    }

    const search = req.query.search;
    let query = {};

    if (search) {
        query = {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        };
    }

    try {
        // Apply the search query to the find method
        const jobPosts = await JobPost.find(query).populate('postedBy', 'username');

        req.session.currentUser = {
            _id: req.session.userId,
            isAdmin: req.session.isAdmin,
            role: req.session.role,
        };
        const user = await User.findById(req.session.userId);
        console.log(user);

        res.render('job-posts', { user: req.session.currentUser, jobPosts, user, search });
    } catch (error) {
        console.error("Error fetching job posts:", error);
        res.status(500).send("Failed to fetch job posts");
    }
});


const methodOverride = require('method-override');
router.use(methodOverride('_method'));


router.delete('/job-posts/:id', async (req, res) => {
    try {
        const jobPostId = req.params.id;
        const jobPost = await JobPost.findById(jobPostId);
        const userId = req.session.userId;

        if (!jobPostId || jobPostId === "null") {
            return res.status(400).send('Invalid job post ID.');
        }

        if (jobPost.postedBy.toString() !== userId.toString()) {
            return res.status(403).send('User is not authorized to delete this job post.');
        }

        await JobPost.findByIdAndDelete(jobPostId);
        res.redirect('/job-posts'); 
    } catch (error) {
        console.error('Failed to delete job post:', error);
        res.status(500).send('Server error.');
    }
});



router.get('/edit-job-post/:id', async (req, res) => {
    const jobPostId = req.params.id;
    try {
        const jobPost = await JobPost.findById(jobPostId).populate('postedBy');
        if (!jobPost) {
            return res.status(404).send('Job post not found.');
        }
        if (jobPost.postedBy._id.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Unauthorized access.');
        }
        res.render('edit-job-post', { jobPost });
    } catch (error) {
        console.error('Error showing edit form:', error);
        res.status(500).send('Server error.');
    }
});



router.post('/edit-job-post/:id', async (req, res) => {
    const jobPostId = req.params.id;
    try {
        const jobPost = await JobPost.findById(jobPostId);
        if (!jobPost) {
            return res.status(404).send('Job post not found.');
        }
        if (jobPost.postedBy.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Unauthorized access.');
        }
        await JobPost.findByIdAndUpdate(jobPostId, req.body, { new: true });
        res.redirect('/job-posts'); // Redirect back to the job posts listing page
    } catch (error) {
        console.error('Error updating job post:', error);
        res.status(500).send('Server error.');
    }
});



router.get('/api/job-posts/:id', async (req, res) => {
    try {
        const jobPost = await JobPost.findById(req.params.id)
                                      .populate('applicants');
        if (!jobPost) {
            return res.status(404).send('Job post not found');
        }
        res.json(jobPost);
    } catch (error) {
        console.error('Error fetching job post details:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/api/job-posts/apply', async (req, res) => {
    const { jobPostId, fullName, email, phoneNumber, isStudying, yearsOfExperience, yourCity } = req.body;
    
    console.log("Received jobPostId:", jobPostId);

    try {
        // Here, you would update your JobPost model to add the applicant to its applicants array.
        // This assumes your JobPost schema is set up to accept an array of applicants similar to how
        // your Workshop model has an array of students.
        await JobPost.findByIdAndUpdate(jobPostId, {
            $push: {
                applicants: {
                    fullName,
                    email,
                    phoneNumber,
                    isStudying,
                    yearsOfExperience,
                    yourCity
                }
            }
        }, { new: true });

        res.status(200).json({ message: 'Application successful!' });
    } catch (error) {
        console.error('Failed to apply:', error);
        res.status(500).json({ message: 'Error applying for job post', error: error });
    }
});


router.get('/job-posts/:jobPostId/applicants', async (req, res) => {
    try {
        const jobPostId = req.params.jobPostId;
        const jobPost = await JobPost.findById(jobPostId).populate('applicants'); // Make sure your JobPost model supports applicants
        if (!jobPost) {
            return res.status(404).send('Job post not found.');
        }
        res.render('JobPosts-Details', { jobPost, jobPostId });
    } catch (error) {
        console.error('Failed to load job applicants details:', error);
        res.status(500).send('Server error.');
    }
});






//? Public Profile 


router.get('/users/:username', async (req, res) => {
    try {
        const username = req.params.username;
        console.log(`Fetching profile for username: ${username}`);

        const user = await User.findOne({ username: username });
        if (!user) {
            console.log("User not found.");
            return res.status(404).send("User not found.");
        }

        if (user.role === 'employer') {
            const posts = await Post.find({ userId: user._id }).lean();
            const jobPosts = await JobPost.find({ postedBy: user._id }).lean();

            res.render('public-profile', { 
                user: user.toObject(), 
                posts, 
                jobPosts
            });

        }
        else if (user.role === 'instructor') {
            const posts = await Post.find({ userId: user._id }).lean();
            const workshops = await Workshop.find({ postedBy: user._id }).lean();

            res.render('public-profile', { 
                user: user.toObject(), 
                posts,
                workshops
            });


        }
        else if (user.role === 'student') {
            const posts = await Post.find({ userId: user._id }).lean();

            res.render('public-profile', { 
                user: user.toObject(), 
                posts
            });
        }

        else{

            throw new Error ('Invalid role' + user.role);
        }

        // Render the public profile with all fetched data
        
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Failed to fetch user profile");
    }
});






router.get('/search-users', async (req, res) => {
    const username = req.query.username;
    res.redirect(`/users/${username}`);
});



//! Workshops 
router.get('/workshops', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const search = req.query.search || ''; // Default to an empty string if no search query
    let query = {};

    if (search) {
        query = {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { instructor: { $regex: search, $options: 'i' } }
            ]
        };
    }

    try {
        const workshops = await Workshop.find(query);
        const isUserInstructor = req.session.role === 'instructor';
        
        const currentUser = {
            _id: req.session.userId,
            isAdmin: req.session.isAdmin,
            workshops: workshops,
            user: req.user,
            isUserInstructor: isUserInstructor,
            search: search  // Pass the search term back to the template
        };
        res.render('workshops', currentUser);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        res.status(500).send('Error loading workshops page');
    }
});


router.post('/post-workshop', async (req, res) => {
    try {
        // Check if the user is logged in and has the 'instructor' role
        if (!req.session.userId || req.session.role !== 'instructor') {
            return res.status(403).send('You do not have permission to post a workshop.');
        }

        // Create a new workshop document from the request body
        const newWorkshop = new Workshop({
            ...req.body,
            postedBy: req.session.userId // Assuming you store the user ID in the session
        });

        // Save the workshop to the database
        await newWorkshop.save();

        // Redirect to the workshops listing page or somewhere relevant
        res.redirect('/workshops');
    } catch (error) {
        console.error('Error posting workshop:', error);
        res.status(500).send('Failed to post the workshop');
    }
});


router.delete('/workshops/:id', async (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = await Workshop.findById(workshopId); // Corrected model reference
        const userId = req.session.userId;

        if (!workshopId || workshopId === "null") {
            return res.status(400).send('Invalid Workshop ID.');
        }

        if (workshop.postedBy.toString() !== userId.toString()) {
            return res.status(403).send('User is not authorized to delete this workshop post.');
        }

        await Workshop.findByIdAndDelete(workshopId); // Corrected model reference

        res.send('Workshop deleted successfully.');
    } catch (error) {
        console.error('Failed to delete Workshop:', error);
        res.status(500).send('Server error.');
    }
});



// Workshop modal 
router.post('/api/workshops/signup', async (req, res) => {
    console.log(req.body);
    const {workshopId, fullName, phoneNumber, email, major, yearInEducation } = req.body;
    

    console.log("Received workshopId:", workshopId);

    try {
        await Workshop.findByIdAndUpdate(workshopId, {
            $push: {
                students: {
                    fullName,
                    phoneNumber,
                    email,
                    major,
                    yearInEducation
                }
            }
        }, { new: true });

        res.status(200).json({ message: 'Sign up successful!' });
    } catch (error) {
        console.error('Failed to sign up student:', error);
        res.status(500).json({ message: 'Error signing up for workshop', error: error });
    }
});





// Get the workshop information and details 

router.get('/api/workshops/:id', async (req, res) => {
    try {
        const workshop = await Workshop.findById(req.params.id)
                                        .populate('postedBy') 
                                        .exec();
        if (!workshop) {
            return res.status(404).send('Workshop not found');
        }
        res.json(workshop);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


router.get('/workshop/:id/details', async (req, res) => {
    try {

        res.render('workshop-details', { workshopId: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});




module.exports = router;
