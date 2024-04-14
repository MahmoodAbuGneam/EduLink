const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const jobPostSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  applicationLink: { type: String, required: false },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{
    fullName: String,
    email: String,
    phoneNumber: String,
    isStudying: Boolean,
    yearsOfExperience: Number,
    yourCity: String
  }],
  postedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const JobPost = mongoose.model('JobPost', jobPostSchema);
module.exports = JobPost;
