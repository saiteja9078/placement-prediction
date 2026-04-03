const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// POST /api/students/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, rollNumber, cgpa, internships, projects,
      workshopsCertifications, extracurricularActivities, placementTraining,
      sscMarks, hscMarks } = req.body;

    // Check if email already exists
    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered', studentId: existing._id });
    }

    const student = new Student({
      name, email, rollNumber, cgpa, internships, projects,
      workshopsCertifications, extracurricularActivities, placementTraining,
      sscMarks, hscMarks,
      currentPhase: 2  // Profile collected, ready for aptitude
    });

    await student.save();
    res.status(201).json({ studentId: student._id, currentPhase: 2 });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/students/:id/profile
router.patch('/:id/profile', async (req, res) => {
  try {
    const updates = req.body;
    updates.currentPhase = 2;
    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/phase
router.get('/:id/phase', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('currentPhase');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ currentPhase: student.currentPhase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
