/**
 * AI Matching - Eligibility Rules & Validation
 * Hard filters + profile validation
 */

const validCategories = ['General', 'OBC', 'SC', 'ST', 'EWS'];

function validateProfile(profile) {
  const errors = [];

  if (profile.percentage !== undefined) {
    const p = Number(profile.percentage);
    if (isNaN(p) || p < 0 || p > 100) errors.push('percentage must be 0–100');
  }
  if (profile.familyIncome !== undefined) {
    const i = Number(profile.familyIncome);
    if (isNaN(i) || i < 0) errors.push('familyIncome must be a positive number');
  }
  if (profile.gender && !['Male', 'Female', 'Other'].includes(profile.gender)) {
    errors.push('gender must be Male, Female, or Other');
  }
  if (profile.category && !validCategories.includes(profile.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  return errors;
}

function isEligible(scholarship, profile) {
  const { percentage = 0, familyIncome = Infinity, category = '', gender = '', course = '' } = profile;

  if (percentage < scholarship.minMarks) return false;
  if (familyIncome > scholarship.maxIncome) return false;
  if (category && !scholarship.categories.includes(category)) return false;
  if (gender && scholarship.gender !== 'All' && scholarship.gender !== gender) return false;
  if (course && scholarship.courses.length > 0 && !scholarship.courses.includes(course)) return false;

  return true;
}

