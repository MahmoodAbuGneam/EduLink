const JobPost = require('../../models/jobPost.js'); 
const dbHandler = require('../config/dbHandler.js'); 
const User = require('../../models/user.js'); 

beforeAll(async () => await dbHandler.connect(), 5000); 
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase(), 5000);


let user;

beforeEach( async()=>{
    user = new User({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123',
    });
    await user.save();
});






describe('JobPost Model Test', () => {
    let jobPostData;

    beforeEach(() => {
        jobPostData = {
            title: 'Software Engineer',
            description: 'Develop full-stack web applications.',
            requirements: 'JavaScript',
            company: 'Tech Inc.',
            location: 'Remote',
            postedBy: user._id, // Ensure 'user._id' is defined in your test setup
        };
    });

    it('create & save job post successfully', async () => {
        const validJobPost = new JobPost(jobPostData);
        const savedJobPost = await validJobPost.save();

        expect(savedJobPost._id).toBeDefined();
        expect(savedJobPost.title).toBe(jobPostData.title);
        expect(savedJobPost.description).toBe(jobPostData.description);
        expect(savedJobPost.requirements).toBe(jobPostData.requirements);
        expect(savedJobPost.company).toBe(jobPostData.company);
        expect(savedJobPost.location).toBe(jobPostData.location);
        expect(savedJobPost.postedBy.toString()).toBe(jobPostData.postedBy.toString());
    });

    it('should fail to save job post without title', async () => {
        delete jobPostData.title;
        const jobPostWithoutTitle = new JobPost(jobPostData);
        await expect(jobPostWithoutTitle.save()).rejects.toThrow();
    });

    it('should fail to save job post without description', async () => {
        delete jobPostData.description;
        const jobPostWithoutDescription = new JobPost(jobPostData);
        await expect(jobPostWithoutDescription.save()).rejects.toThrow();
    });

    it('should fail to save job post without requirements', async () => {
        delete jobPostData.requirements;
        const jobPostWithoutRequirements = new JobPost(jobPostData);
        await expect(jobPostWithoutRequirements.save()).rejects.toThrow();
    });

    it('should fail to save job post without company', async () => {
        delete jobPostData.company;
        const jobPostWithoutCompany = new JobPost(jobPostData);
        await expect(jobPostWithoutCompany.save()).rejects.toThrow();
    });

    it('should fail to save job post without location', async () => {
        delete jobPostData.location;
        const jobPostWithoutLocation = new JobPost(jobPostData);
        await expect(jobPostWithoutLocation.save()).rejects.toThrow();
    });

    // If 'postedBy' is a required field, add a test case for it
    it('should fail to save job post without postedBy', async () => {
        delete jobPostData.postedBy;
        const jobPostWithoutPostedBy = new JobPost(jobPostData);
        await expect(jobPostWithoutPostedBy.save()).rejects.toThrow();
    });
});
