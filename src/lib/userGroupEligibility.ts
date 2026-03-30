import type { UserProfile, EligibilityCriteria } from './userGroupTypes';

export function parseEligibilityCriteria(criteriaText: string): EligibilityCriteria {
  const normalized = criteriaText.toLowerCase();
  const criteria: EligibilityCriteria = {};

  const extractValues = (text: string, patterns: string[]): string[] => {
    const values: string[] = [];

    patterns.forEach(pattern => {
      if (text.includes(pattern.toLowerCase())) {
        values.push(pattern);
      }
    });

    return values;
  };

  const skillsPatterns = ['Gold tier', 'Platinum tier', 'Technical Support', 'Billing', 'Escalations'];
  const languagePatterns = ['English', 'Spanish'];
  const regionPatterns = ['EMEA', 'Austin', 'Dallas'];
  const capacityPatterns = ['Voice high priority', 'Voice standard', 'Chat priority'];
  const intentPatterns = ['Billing inquiry', 'Technical issue', 'Fraud assist', 'Account management', 'Escalation', 'Product inquiry'];

  const skillsFound = extractValues(normalized, skillsPatterns);
  if (skillsFound.length > 0) {
    criteria.skills = skillsFound;
  }

  const languagesFound = extractValues(normalized, languagePatterns);
  if (languagesFound.length > 0) {
    criteria.language = languagesFound;
  }

  const regionsFound = extractValues(normalized, regionPatterns);
  if (regionsFound.length > 0) {
    criteria.region = regionsFound;
  }

  const capacityFound = extractValues(normalized, capacityPatterns);
  if (capacityFound.length > 0) {
    criteria.capacityProfile = capacityFound;
  }

  const intentFound = extractValues(normalized, intentPatterns);
  if (intentFound.length > 0) {
    criteria.intent = intentFound;
  }

  return criteria;
}

export function evaluateUserEligibility(user: UserProfile, criteria: EligibilityCriteria): boolean {
  const matchesAttribute = (userValues: string[], criteriaValues: string[] | undefined): boolean => {
    if (!criteriaValues || criteriaValues.length === 0) {
      return true;
    }

    return criteriaValues.some(criteriaValue =>
      userValues.some(userValue =>
        userValue.toLowerCase() === criteriaValue.toLowerCase()
      )
    );
  };

  const matchesSkills = matchesAttribute(user.skills, criteria.skills);
  const matchesLanguage = matchesAttribute(user.language, criteria.language);
  const matchesRegion = matchesAttribute(user.region, criteria.region);
  const matchesCapacity = matchesAttribute(user.capacityProfile, criteria.capacityProfile);
  const matchesIntent = matchesAttribute(user.intent, criteria.intent);

  return matchesSkills && matchesLanguage && matchesRegion && matchesCapacity && matchesIntent;
}

export function getEligibleUsers(users: UserProfile[], criteriaText: string): UserProfile[] {
  if (!criteriaText.trim()) {
    return users;
  }

  const criteria = parseEligibilityCriteria(criteriaText);
  return users.filter(user => evaluateUserEligibility(user, criteria));
}

export const EXAMPLE_CRITERIA = [
  'Users with Spanish or English language, Skills Gold tier or Platinum tier, Voice high priority capacity profile, region EMEA.',
  'Users support Austin or Dallas region.',
  'Platinum tier skills with Voice high priority capacity profile.',
  'Spanish language support with Billing skills.'
];
