export interface AdminUser {
  id: string;
  name: string;
  email: string;
  major: string;
  stnum: string;
  birthday?: string;
  phone?: string;
  is_admin: boolean;
  approved: boolean;
  created_at: string;
  image_url?: string;
  rank_tier?: string | null;
  rank_detail?: string | null;
}

export type FilterType = 'all' | 'admin' | 'user' | 'approved' | 'pending';

export interface AdminStats {
  total: number;
  admins: number;
  users: number;
  approved: number;
  pending: number;
}

export interface AdminAction {
  type: 'approve' | 'delete' | 'toggle_admin' | 'update';
  userId: string;
  data?: any;
}
