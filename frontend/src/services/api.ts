import type { User } from '../types';

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');

if (import.meta.env.PROD && !configuredBase) {
  throw new Error('VITE_API_BASE_URL is required for production builds.');
}
if (import.meta.env.PROD && configuredBase && !configuredBase.startsWith('https://')) {
  throw new Error('VITE_API_BASE_URL must use HTTPS in production.');
}

const API_BASE = configuredBase || 'http://127.0.0.1:8000/api';

export interface AuthResponse {
  phase: 'login' | 'first-login';
  token?: string;
  user: User;
  message?: string;
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

function getToken() {
  return sessionStorage.getItem('smartclass_token') || localStorage.getItem('smartclass_token');
}

function clearToken() {
  getCache.clear();
  sessionStorage.removeItem('smartclass_token');
  localStorage.removeItem('smartclass_token');
}

function saveToken(token: string, remember: boolean) {
  clearToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('smartclass_token', token);
}

function replaceToken(token: string) {
  const remembered = localStorage.getItem('smartclass_token') !== null;
  saveToken(token, remembered);
}

const GET_CACHE_TTL_MS = 20_000;

// Number of GET requests currently in flight. Lets shared UI (EmptyState)
// show "Loading…" instead of a misleading "nothing here" while data is on its way.
let pendingGets = 0;
const pendingListeners = new Set<() => void>();
function bumpPending(delta: number) {
  pendingGets += delta;
  pendingListeners.forEach(listener => listener());
}
export function subscribePending(listener: () => void) {
  pendingListeners.add(listener);
  return () => { pendingListeners.delete(listener); };
}
export const getPendingCount = () => pendingGets;
const getCache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

/** Drop cached reads. Called after every write and on logout/login. */
export function clearApiCache() {
  getCache.clear();
  inflight.clear();
}

/** Wake a sleeping backend (e.g. Render free tier) while the user is still on the login screen. */
export function warmUpBackend() {
  fetch(`${API_BASE}/health`, { cache: 'no-store' }).catch(() => undefined);
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authenticated = true, headers, ...fetchOptions } = options;
  const token = getToken();
  if (authenticated && !token) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.body && !(fetchOptions.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // A non-JSON response is handled by the generic message below.
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) clearToken();
    throw new Error(formatError(data?.detail) || `Request failed (${response.status}).`);
  }
  return data as T;
}

function formatError(detail: unknown): string {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item: any) => item?.msg || JSON.stringify(item)).join('; ');
  }
  return JSON.stringify(detail);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    try {
      return await rawRequest<T>(path, options);
    } finally {
      clearApiCache();
    }
  }
  const key = `${getToken()?.slice(-12) ?? 'anon'}:${path}`;
  const hit = getCache.get(key);
  if (hit && Date.now() - hit.at < GET_CACHE_TTL_MS) return hit.data as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  bumpPending(1);
  const promise = rawRequest<T>(path, options)
    .then((data) => {
      getCache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => { inflight.delete(key); bumpPending(-1); });
  inflight.set(key, promise);
  return promise;
}

/** Warm the cache for the screens a user is most likely to open next. */
export function prefetchForRole(role: string) {
  const common = ['/announcements', '/notifications', '/calendar'];
  const byRole: Record<string, string[]> = {
    student: [`/dashboard/stats?role=student`, '/timetable', '/assignments', '/quizzes', '/attendance/student', '/results', '/materials'],
    faculty: [`/dashboard/stats?role=faculty`, '/timetable', '/assignments', '/quizzes', '/attendance/faculty', '/lectures'],
    admin: [`/dashboard/stats?role=admin`],
    council: ['/events'],
  };
  [...(byRole[role] || []), ...common].forEach((path, index) => {
    setTimeout(() => { request<any>(path).catch(() => undefined); }, index * 60);
  });
}

export const api = {
  async login(userId: string, password: string, remember = false): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ user_id: userId, password, remember }),
    });
    if (data.token) saveToken(data.token, remember);
    return data;
  },

  async firstLogin(newPass: string, confirmPass: string) {
    const data = await request<{ token: string; user: User }>('/auth/first-login', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPass, confirm_password: confirmPass }),
    });
    replaceToken(data.token);
    return data;
  },

  async me() {
    return request<User>('/auth/me');
  },

  async logout() {
    try {
      return await request<{ message: string }>('/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },

  async changePassword(currentPass: string, newPass: string, confirmPass: string) {
    const data = await request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPass,
        new_password: newPass,
        confirm_password: confirmPass,
      }),
    });
    clearToken();
    return data;
  },

  getClassrooms: () => request<any[]>('/classrooms'),
  getClasses: () => request<any[]>('/academic/classes'),
  getCourses: () => request<any[]>('/academic/courses'),
  getMyClass: () => request<any>('/academic/my-class'),

  searchClassroomAvailability: (date: string, startTime: string, endTime: string) =>
    request<any>('/classrooms/search-availability', {
      method: 'POST',
      body: JSON.stringify({ date, start_time: startTime, end_time: endTime }),
    }),

  getTimetable: (day?: string) =>
    request<Record<string, any[]>>(`/timetable${day ? `?day=${encodeURIComponent(day)}` : ''}`),

  checkTimetableConflict(params: {
    day: string;
    startTime: string;
    endTime: string;
    classroom: string;
    facultyId: string;
    classId: string;
  }) {
    const query = new URLSearchParams({
      day: params.day,
      start_time: params.startTime,
      end_time: params.endTime,
      classroom: params.classroom,
      faculty_id: params.facultyId,
      class_id: params.classId,
    });
    return request<any>(`/timetable/check-conflict?${query}`, { method: 'POST' });
  },

  getStudentAttendance: () => request<any>('/attendance/student'),
  getFacultyAttendance: () => request<any>('/attendance/faculty'),
  getMaterials: (courseId?: string) =>
    request<any[]>(`/materials${courseId ? `?course_id=${encodeURIComponent(courseId)}` : ''}`),
  uploadMaterial: (data: { courseId: string; unit: string; title: string; description: string; file: File }) => {
    const form = new FormData();
    form.append('course_id', data.courseId);
    form.append('unit', data.unit);
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('file', data.file);
    return request<any>('/materials/upload', { method: 'POST', body: form });
  },
  async downloadMaterial(materialId: string, filename: string) {
    const token = getToken();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch(`${API_BASE}/materials/${encodeURIComponent(materialId)}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      let detail = '';
      try { detail = (await response.json()).detail; } catch { /* use fallback */ }
      throw new Error(detail || `Download failed (${response.status}).`);
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  },

  createLecture: (lectureData: any) =>
    request<any>('/lectures/create', { method: 'POST', body: JSON.stringify(lectureData) }),

  getLectures: () => request<any[]>('/lectures'),
  getLectureRoster: (lectureId: number) => request<any>(`/lectures/${lectureId}/roster`),

  markAttendance: (lectureId: number, attendance: { student_id: string; status: string }[]) =>
    request<any>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ lecture_id: lectureId, attendance }),
    }),

  getAssignments: () => request<any[]>('/assignments'),

  createAssignment: (data: any) =>
    request<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),

  getAssignmentSubmissions: (assignmentId: string) =>
    request<any[]>(`/assignments/${assignmentId}/submissions`),

  submitAssignment: (assignmentId: string, submissionText: string, submissionFile?: string) =>
    request<any>(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission_text: submissionText, submission_file: submissionFile || null }),
    }),

  gradeSubmission: (submissionId: number, marks: number, feedback: string) =>
    request<any>(`/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ marks, feedback }),
    }),

  getQuizzes: () => request<any[]>('/quizzes'),
  getQuizQuestions: (quizId: string) => request<any[]>(`/quizzes/${quizId}/questions`),
  getQuizAttempts: (quizId: string) => request<any[]>(`/quizzes/${quizId}/attempts`),
  submitQuiz: (quizId: string, answers: Record<string, number>) =>
    request<any>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  getAIReport: (quizId: string) => request<any>(`/ai-report/${quizId}`),
  getResults: () => request<any[]>('/results'),
  getPerformanceInsights: (courseId?: string) =>
    request<any>(`/performance-insights${courseId ? `?course_id=${encodeURIComponent(courseId)}` : ''}`),

  getAnnouncements: () => request<any[]>('/announcements'),
  createAnnouncement: (data: { title: string; content: string; audience: string; type: string }) =>
    request<any>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),

  getCalendar: (category?: string) =>
    request<any[]>(`/calendar${category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''}`),
  getEvents: () => request<any[]>('/events'),
  createEvent: (eventData: any) =>
    request<any>('/events', { method: 'POST', body: JSON.stringify(eventData) }),

  getForums: (courseCode?: string) =>
    request<any[]>(`/forums${courseCode ? `?course_code=${encodeURIComponent(courseCode)}` : ''}`),
  createForumTopic: (courseId: string, title: string, content: string) =>
    request<any>('/forums', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, title, content }),
    }),
  getForumReplies: (topicId: string) => request<any[]>(`/forums/${topicId}/replies`),
  postForumReply: (topicId: string, content: string) =>
    request<any>(`/forums/${topicId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }),

  getGrievances: () => request<any[]>('/grievances'),
  submitGrievance: (subject: string, category: string, description: string) =>
    request<any>('/grievances', {
      method: 'POST',
      body: JSON.stringify({ subject, category, description }),
    }),
  updateGrievance: (id: string, status: string, resolution?: string) =>
    request<any>(`/grievances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution }),
    }),

  getDashboardStats: (role: string) =>
    request<any>(`/dashboard/stats?role=${encodeURIComponent(role)}`),
  // ── Admin lifecycle ───────────────────────────────────────────
  adminListUsers: (role?: string, q?: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q) params.set('q', q);
    return request<any[]>(`/admin/users?${params}`);
  },
  adminCreateUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUser: (id: string, data: any) =>
    request<any>(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminResetPassword: (id: string) =>
    request<any>(`/admin/users/${encodeURIComponent(id)}/reset-password`, { method: 'POST' }),
  adminListClasses: () => request<any[]>('/admin/classes'),
  adminSaveClass: (data: any) => request<any>('/admin/classes', { method: 'PUT', body: JSON.stringify(data) }),
  adminListCourses: () => request<any[]>('/admin/courses'),
  adminSaveCourse: (data: any) => request<any>('/admin/courses', { method: 'PUT', body: JSON.stringify(data) }),
  adminListAssignments: () => request<any[]>('/admin/assignments'),
  adminAssign: (data: any) => request<any>('/admin/assignments', { method: 'POST', body: JSON.stringify(data) }),
  adminUnassign: (id: number) => request<any>(`/admin/assignments/${id}`, { method: 'DELETE' }),

  // ── Council events / quiz authoring ───────────────────────────
  updateEvent: (id: string, data: any) =>
    request<any>(`/events/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<any>(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createQuiz: (data: any) => request<any>('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  setQuizRelease: (id: string, isReleased: boolean) =>
    request<any>(`/quizzes/${encodeURIComponent(id)}/release`, {
      method: 'POST', body: JSON.stringify({ is_released: isReleased }),
    }),
};
