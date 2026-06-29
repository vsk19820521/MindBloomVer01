// Returns age in whole years (floor) from birth month + year
export function calcAge(birthMonth, birthYear) {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (now.getMonth() + 1 < birthMonth) age--; // birthday not yet this year
  return age;
}

// Returns puzzle band string
export function ageToBand(age) {
  if (age <= 5) return '4-5';
  if (age <= 7) return '6-7';
  return '8-9';          // 8+ years
}
