export type Role = 'student' | 'faculty' | 'admin' | 'council';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  email?: string | null;
  role: Role;
  council?: string | null;
  isHOD?: boolean;
  department: string;
  class?: string | null;
  avatar?: string | null;
  firstLogin?: boolean;
}
