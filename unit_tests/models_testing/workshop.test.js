const Workshop = require('../../models/Workshop.js');
const User = require('../../models/user.js');
const dbHandler = require('../config/dbHandler.js');



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




describe('Workshop Model Test', () => {
    let workshopData;

    beforeEach(() => {
        workshopData = {
            title: "Data Structures Example Workshop",
            description: "Learn the basics of data structures",
            date: new Date(),
            instructor: 'Hadas <3',
            postedBy: user._id,
        };
    });

    it('create & save workshop successfully', async () => {
        const validWorkshop = new Workshop(workshopData);
        const savedWorkshop = await validWorkshop.save();

        expect(savedWorkshop._id).toBeDefined();
        expect(savedWorkshop.title).toBe(workshopData.title);
        expect(savedWorkshop.description).toBe(workshopData.description);
        expect(savedWorkshop.date).toEqual(workshopData.date);
        expect(savedWorkshop.instructor).toBe(workshopData.instructor);
        expect(savedWorkshop.postedBy.toString()).toBe(workshopData.postedBy.toString());
    });

    it('should fail to save workshop without title', async () => {
        delete workshopData.title;
        const workshopWithoutTitle = new Workshop(workshopData);
        await expect(workshopWithoutTitle.save()).rejects.toThrow();
    });

    it('should fail to save workshop without description', async () => {
        delete workshopData.description;
        const workshopWithoutDescription = new Workshop(workshopData);
        await expect(workshopWithoutDescription.save()).rejects.toThrow();
    });

    it('should fail to save workshop without date', async () => {
        delete workshopData.date;
        const workshopWithoutDate = new Workshop(workshopData);
        await expect(workshopWithoutDate.save()).rejects.toThrow();
    });

    it('should fail to save workshop without instructor', async () => {
        delete workshopData.instructor;
        const workshopWithoutInstructor = new Workshop(workshopData);
        await expect(workshopWithoutInstructor.save()).rejects.toThrow();
    });

    it('should fail to save workshop without postedBy', async () => {
        delete workshopData.postedBy;
        const workshopWithoutPostedBy = new Workshop(workshopData);
        await expect(workshopWithoutPostedBy.save()).rejects.toThrow();
    });
});
