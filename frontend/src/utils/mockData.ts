import type { ApplicationItem, ChartPoint, Company, DashboardMetric, Internship, NotificationItem } from '@/types';

export const metricsByRole: Record<string, DashboardMetric[]> = {
  Student: [
    { label: 'Active applications', value: '14', delta: '+3 this week', tone: 'sky' },
    { label: 'Saved internships', value: '31', delta: '8 high match', tone: 'mint' },
    { label: 'Unread updates', value: '9', delta: '2 interviews', tone: 'amber' },
    { label: 'Response rate', value: '68%', delta: '+11%', tone: 'coral' },
  ],
  Recruiter: [
    { label: 'Open internships', value: '12', delta: '4 expiring soon', tone: 'sky' },
    { label: 'Applicants this month', value: '248', delta: '+19%', tone: 'mint' },
    { label: 'Interviews booked', value: '37', delta: '12 today', tone: 'amber' },
    { label: 'Offer acceptance', value: '74%', delta: '+6%', tone: 'coral' },
  ],
  Admin: [
    { label: 'Platform users', value: '12.4k', delta: '+420 this month', tone: 'sky' },
    { label: 'Companies onboarded', value: '327', delta: '+21', tone: 'mint' },
    { label: 'Reports exported', value: '1.1k', delta: 'steady', tone: 'amber' },
    { label: 'Security alerts', value: '3', delta: 'all reviewed', tone: 'coral' },
  ],
};

export const chartData: ChartPoint[] = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 16 },
  { label: 'Thu', value: 24 },
  { label: 'Fri', value: 20 },
  { label: 'Sat', value: 13 },
  { label: 'Sun', value: 9 },
];

export const mockCompanies: Company[] = [
  { id: 'c1', name: 'Northstar Labs', description: 'AI and cloud products', website: 'https://northstar.dev', location: 'Tirane', isVerified: true },
  { id: 'c2', name: 'Civic Stack', description: 'Govtech design systems', website: 'https://civicstack.io', location: 'Prishtine', isVerified: true },
  { id: 'c3', name: 'Wave Commerce', description: 'Retail analytics', website: 'https://wavecommerce.app', location: 'Remote', isVerified: false },
];

export const mockInternships: Internship[] = [
  {
    id: 'i1',
    title: 'Frontend Engineering Intern',
    description: 'Work on product surfaces, dashboards, and data-rich workflows.',
    location: 'Tirane / Hybrid',
    type: 'Internship',
    status: 'Published',
    maxApplicants: 4,
    currentApplicants: 2,
    salaryMin: 350,
    salaryMax: 600,
    deadlineAt: '2026-06-20T00:00:00Z',
    company: mockCompanies[0],
    category: 'Software Engineering',
  },
  {
    id: 'i2',
    title: 'Data Analytics Associate',
    description: 'Build reporting pipelines and dashboards for product teams.',
    location: 'Remote',
    type: 'FullTime',
    status: 'Published',
    maxApplicants: 3,
    currentApplicants: 3,
    salaryMin: 700,
    salaryMax: 1100,
    deadlineAt: '2026-06-28T00:00:00Z',
    company: mockCompanies[2],
    category: 'Data Analytics',
  },
  {
    id: 'i3',
    title: 'Recruitment Operations Intern',
    description: 'Support candidate pipelines and employer branding.',
    location: 'Prishtine',
    type: 'Internship',
    status: 'Published',
    maxApplicants: 2,
    currentApplicants: 1,
    salaryMin: 300,
    salaryMax: 500,
    deadlineAt: '2026-06-15T00:00:00Z',
    company: mockCompanies[1],
    category: 'Marketing',
  },
];

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', userId: 'u1', title: 'Interview scheduled', body: 'Northstar Labs invited you for Tuesday 10:00.', type: 'Interview', isRead: false, createdAt: '2026-05-17T10:15:00Z' },
  { id: 'n2', userId: 'u1', title: 'Application viewed', body: 'A recruiter reviewed your CV for Data Analytics Associate.', type: 'Application', isRead: false, createdAt: '2026-05-16T15:30:00Z' },
  { id: 'n3', userId: 'u1', title: 'Weekly digest', body: '6 new internships match your saved skills.', type: 'System', isRead: true, createdAt: '2026-05-15T09:00:00Z' },
];

export const mockApplications: ApplicationItem[] = [
  { id: 'a1', internshipId: 'i1', internshipTitle: 'Frontend Engineering Intern', applicantUserId: 'u1', applicantName: 'Ardit D.', status: 'Interview', createdAt: '2026-05-10T09:00:00Z' },
  { id: 'a2', internshipId: 'i2', internshipTitle: 'Data Analytics Associate', applicantUserId: 'u1', applicantName: 'Ardit D.', status: 'Submitted', createdAt: '2026-05-12T11:30:00Z' },
  { id: 'a3', internshipId: 'i3', internshipTitle: 'Recruitment Operations Intern', applicantUserId: 'u1', applicantName: 'Ardit D.', status: 'In Review', createdAt: '2026-05-14T16:00:00Z' },
];
