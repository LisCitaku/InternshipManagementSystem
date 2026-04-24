export type Role = 'Admin' | 'Student' | 'Recruiter';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  roles: Role[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface Internship {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  status: string;
  maxApplicants: number;
  currentApplicants: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadlineAt?: string | null;
  company: Company;
  category: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ChatConversation {
  conversationId: string;
  recipientUserId: string;
  recipientName: string;
  recipientRole: string;
  subject?: string | null;
  lastMessageBody?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface ChatContact {
  userId: string;
  fullName: string;
  role: string;
}

export interface CurrentUserProfileDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  roles: string[];
  university: string;
  fieldOfStudy: string;
  headline: string;
  bio: string;
  avatarUrl?: string | null;
  avatarFileName?: string | null;
  cvUrl?: string | null;
  cvFileName?: string | null;
}

export interface ApplicationItem {
  id: string;
  internshipId: string;
  internshipTitle: string;
  applicantUserId: string;
  applicantName: string;
  status: string;
  createdAt: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  tone: 'sky' | 'mint' | 'coral' | 'amber';
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface Option {
  label: string;
  value: string;
}

export interface CmsPage {
  pageKey: string;
  title: string;
  description: string;
  fields: Record<string, string>;
  updatedAt: string;
}

export interface CmsPageUpdateRequest {
  title: string;
  description: string;
  fields: Record<string, string>;
}

export interface ImportResult {
  entity: string;
  totalRows: number;
  upsertedRows: number;
  failedRows: number;
  messages: string[];
}
