/**
 * AI Matching - Scoring Engine
 * Extracted from matchingController.js
 * Returns { score: 0-100, reasons: [], missing: [] }
 */

function scoreScholarship(scholarship, profile) {
  let score = 0;
  const reasons = [];
  const missing = [];

  const {
    percentage = 0,
    familyIncome = Infinity,
    category = '',
    gender = '',
    course = '',
    state = '',
    disability = false,
  } = profile;

  // 1. Category (25 pts)
  if (category && scholarship.categories.includes(category)) {
    score += 25;
    reasons.push(`Matches your ${category} category`);
  } else if (category) {
    missing.push('Category not eligible');
  }

  // 2. Marks (20 pts + 8 bonus)
  if (percentage >= scholarship.minMarks) {
    score += 20;
    reasons.push(`Your ${percentage}% meets the ${scholarship.minMarks}% requirement`);
    if (percentage >= scholarship.minMarks + 10) {
      score += 8;
      reasons.push('Outstanding academic performance bonus');
    }
  } else {
    missing.push(`Marks below minimum (${scholarship.minMarks}% required)`);
  }

  // 3. Income (20 pts + 5 bonus)
  if (familyIncome <= scholarship.maxIncome) {
    score += 20;
    reasons.push('Family income within eligible range');
    if (familyIncome <= scholarship.maxIncome * 0.5) {
      score += 5;
      reasons.push('Lower income — higher priority');
    }
  } else {
    missing.push(`Income exceeds limit (₹${scholarship.maxIncome.toLocaleString('en-IN')} max)`);
  }

  // 4. Course (15 pts)
  if (course && scholarship.courses.includes(course)) {
    score += 15;
    reasons.push(`Matches your ${course} course`);
  } else if (course) {
    missing.push('Course not covered by this scholarship');
  }

  // 5. Gender (10 pts)
  if (scholarship.gender === 'All') {
    score += 10;
  } else if (gender && scholarship.gender === gender) {
    score += 10;
    reasons.push('Gender-specific scholarship — you qualify');
  } else if (gender) {
    missing.push('Gender not eligible');
  }

  // 6. Location (5 pts)
  if (scholarship.location === 'All India') {
    score += 5;
  } else if (state && scholarship.location.toLowerCase().includes(state.toLowerCase())) {
    score += 5;
    reasons.push('Region-specific advantage');
  }

  // 7. PwD (5 pts)
  if (scholarship.disability && disability) {
    score += 5;
    reasons.push('PwD scholarship — special eligibility');
  }

  return {
    score: Math.min(score, 100),
    reasons,
    missing,
  };
}

module.exports = { scoreScholarship };
