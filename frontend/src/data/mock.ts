// Types only — all data now comes from the API.
// Generated static snapshots for non-personal data live in ./generated/*.json

export type Role = 'student' | 'faculty' | 'admin' | 'council';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isHOD?: boolean;
  department: string;
  class?: string;
  avatar?: string;
  firstLogin?: boolean;
  initials?: string;
  rollNo?: string;
  mobile?: string;
}
