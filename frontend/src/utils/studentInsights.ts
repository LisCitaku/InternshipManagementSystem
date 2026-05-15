import type { CurrentUserProfileDto, Internship } from '@/types';
import { isOpportunityOpen } from '@/utils/internshipCapacity';

export interface RecommendedInternship extends Internship {
  matchScore: number;
  reasons: string[];
}

export interface ProfileCompletion {
  score: number;
  completed: number;
  total: number;
  missing: string[];
}

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

const contains = (haystack: string, needle: string) => {
  if (!needle) return false;
  return haystack.includes(needle);
};

export function getProfileCompletion(profile: CurrentUserProfileDto): ProfileCompletion {
  const checks = [
    { label: 'First name', done: Boolean(profile.firstName.trim()) },
    { label: 'Last name', done: Boolean(profile.lastName.trim()) },
    { label: 'Phone number', done: Boolean(profile.phoneNumber?.trim()) },
    { label: 'University', done: Boolean(profile.university.trim()) },
    { label: 'Field of study', done: Boolean(profile.fieldOfStudy.trim()) },
    { label: 'Headline', done: Boolean(profile.headline.trim()) },
    { label: 'Bio', done: Boolean(profile.bio.trim()) },
    { label: 'Avatar', done: Boolean(profile.avatarUrl) },
    { label: 'CV', done: Boolean(profile.cvUrl) },
  ];

  const completed = checks.filter((item) => item.done).length;
  const total = checks.length;

  return {
    score: Math.round((completed / total) * 100),
    completed,
    total,
    missing: checks.filter((item) => !item.done).map((item) => item.label),
  };
}

export function buildRecommendedInternships(
  internships: Internship[],
  profile: Pick<CurrentUserProfileDto, 'fieldOfStudy' | 'university'>,
  limit = 3,
): RecommendedInternship[] {
  const study = normalize(profile.fieldOfStudy);
  const university = normalize(profile.university);

  return internships
    .filter((internship) => isOpportunityOpen(internship))
    .map((internship) => {
      const title = normalize(internship.title);
      const description = normalize(internship.description);
      const category = normalize(internship.category);
      const location = normalize(internship.location);
      const companyName = normalize(internship.company?.name);

      let score = 0;
      const reasons: string[] = [];

      if (study && (contains(title, study) || contains(description, study) || contains(category, study))) {
        score += 50;
        reasons.push(`Matches ${profile.fieldOfStudy}`);
      }

      const studyKeywords = study.split(/[\s,/.-]+/).filter(Boolean).filter((item) => item.length > 2);
      const keywordHit = studyKeywords.some((keyword) => contains(title, keyword) || contains(description, keyword) || contains(category, keyword));
      if (!score && keywordHit) {
        score += 30;
        reasons.push('Related to your study area');
      }

      if (location.includes('remote') || location.includes('tirane') || location.includes('prishtine')) {
        score += 10;
        reasons.push('Popular student location');
      }

      if (companyName) {
        score += 5;
        reasons.push(internship.company?.isVerified ? 'Verified company' : 'Open opportunity');
      }

      if (university && contains(description, university)) {
        score += 15;
        reasons.push('Aligned with your university context');
      }

      return {
        ...internship,
        matchScore: score,
        reasons: reasons.slice(0, 3),
      };
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
