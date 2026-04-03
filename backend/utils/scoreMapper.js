/**
 * Score mapping utilities for converting raw scores to dataset ranges.
 * These mappings ensure the ML model receives values in the expected ranges.
 */

// Map raw aptitude correct answers (0–20) → dataset range (60–90)
function mapAptitudeScore(rawCorrect) {
  const mapped = 60 + (rawCorrect / 20) * 30;
  return Math.round(Math.min(90, Math.max(60, mapped)));
}

// Map communication AI score (0–100 average) → dataset range (3.0–4.80)
function mapSoftSkillsRating(aiAverageScore) {
  const mapped = 3.0 + (aiAverageScore / 100) * 1.8;
  return parseFloat(Math.min(4.8, Math.max(3.0, mapped)).toFixed(2));
}

// CodingScore is used as-is (0–30 maps directly to ML model range)
// No mapping needed — the dataset was trained on 0–30 range

// Build the exact ML feature vector — 11 features, matching training column order
function buildMLFeatureVector(student) {
  const features = {
    CGPA: student.cgpa || 0,
    Internships: student.internships || 0,
    Projects: student.projects || 0,
    'Workshops/Certifications': student.workshopsCertifications || 0,
    AptitudeTestScore: student.aptitudeTestScore || 60,        // default to min range
    SoftSkillsRating: student.softSkillsRating || 3.0,         // default to min range
    ExtracurricularActivities: student.extracurricularActivities || 'No',
    PlacementTraining: student.placementTraining || 'No',
    SSC_Marks: student.sscMarks || 0,
    HSC_Marks: student.hscMarks || 0,
    CodingScore: student.codingTotalScore || 0
  };

  // Validate all 11 features are present and not undefined
  const REQUIRED_KEYS = [
    'CGPA', 'Internships', 'Projects', 'Workshops/Certifications',
    'AptitudeTestScore', 'SoftSkillsRating', 'ExtracurricularActivities',
    'PlacementTraining', 'SSC_Marks', 'HSC_Marks', 'CodingScore'
  ];
  const missing = REQUIRED_KEYS.filter(k => features[k] === undefined || features[k] === null);
  if (missing.length > 0) {
    console.warn(`[scoreMapper] WARNING: Missing ML features: ${missing.join(', ')}`);
  }
  console.log(`[scoreMapper] Built ${Object.keys(features).length}/11 features:`, JSON.stringify(features));

  return features;
}

module.exports = { mapAptitudeScore, mapSoftSkillsRating, buildMLFeatureVector };
