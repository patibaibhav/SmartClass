export type Role = 'student' | 'faculty' | 'admin' | 'council';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  role: Role;
  isHOD?: boolean;
  department: string;
  class?: string | null;
  avatar?: string | null;
  firstLogin?: boolean;
}
