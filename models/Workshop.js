const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const workshopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  date: { type: Date, required: true },
  registrationLink: { type: String, required: false },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{
    fullName: String,
    phoneNumber: String,
    email: String,
    major: String,
    yearInEducation: String
}]
}, { timestamps: true });

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = Workshop;
