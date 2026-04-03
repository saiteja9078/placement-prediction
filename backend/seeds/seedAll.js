const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seedAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const AptitudeQuestion = require('../models/AptitudeQuestion');
  const CodingQuestion = require('../models/CodingQuestion');
  const CommunicationQuestion = require('../models/CommunicationQuestion');

  // Seed aptitude (100 questions)
  const { questions: aptQ } = require('./seedAptitude');
  await AptitudeQuestion.deleteMany({});
  await AptitudeQuestion.insertMany(aptQ);
  console.log(`Seeded ${aptQ.length} aptitude questions`);

  // Seed coding (50 questions)
  const { questions: codQ } = require('./seedCoding');
  await CodingQuestion.deleteMany({});
  await CodingQuestion.insertMany(codQ);
  console.log(`Seeded ${codQ.length} coding questions`);

  // Seed communication
  const { questions: comQ } = require('./seedCommunication');
  await CommunicationQuestion.deleteMany({});
  await CommunicationQuestion.insertMany(comQ);
  console.log(`Seeded ${comQ.length} communication questions`);

  console.log('\nAll seeds completed!');
  await mongoose.disconnect();
}

seedAll().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
