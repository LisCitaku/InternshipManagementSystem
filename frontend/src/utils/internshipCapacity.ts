import type { Internship } from '@/types';

const isPublished = (status: string) => status === 'Published';

export function getPositionsLeft(internship: Internship) {
  return Math.max(internship.maxApplicants - internship.currentApplicants, 0);
}

export function isOpportunityOpen(internship: Internship) {
  return isPublished(internship.status) && getPositionsLeft(internship) > 0;
}

export function getOpportunityCapacityLabel(internship: Internship) {
  const positionsLeft = getPositionsLeft(internship);
  if (positionsLeft <= 0) {
    return 'Position full';
  }

  return `${positionsLeft} position${positionsLeft === 1 ? '' : 's'} left`;
}
