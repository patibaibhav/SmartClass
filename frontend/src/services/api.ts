const API_BASE = 'http://127.0.0.1:8000/api';

export interface AuthResponse {
  phase: 'login' | 'first-login';
  token?: string;
  user: any;
  message?: string;
}

export const api = {
  // Auth
  async login(userId: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid User ID or password. Please try again.');
      }
      if (data.token) {
        localStorage.setItem('smartclass_token', data.token);
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  },

  async firstLogin(userId: string, newPass: string, confirmPass: string) {
    const res = await fetch(`${API_BASE}/auth/first-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        new_password: newPass,
        confirm_password: confirmPass
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update password');
    }
    if (data.token) {
      localStorage.setItem('smartclass_token', data.token);
    }
    return data;
  },

  async changePassword(currentPass: string, newPass: string, confirmPass: string) {
    const token = localStorage.getItem('smartclass_token');
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: currentPass,
        new_password: newPass,
        confirm_password: confirmPass
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to change password');
    return data;
  },

  // Classrooms & Availability
  async getClassrooms() {
    try {
      const res = await fetch(`${API_BASE}/classrooms`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async searchClassroomAvailability(date: string, startTime: string, endTime: string) {
    try {
      const res = await fetch(`${API_BASE}/classrooms/search-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, start_time: startTime, end_time: endTime })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Timetable
  async getTimetable() {
    try {
      const res = await fetch(`${API_BASE}/timetable`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async checkTimetableConflict(params: {
    day: string;
    startTime: string;
    endTime: string;
    classroom: string;
    facultyId: string;
    classId: string;
  }) {
    try {
      const qs = new URLSearchParams({
        day: params.day,
        start_time: params.startTime,
        end_time: params.endTime,
        classroom: params.classroom,
        faculty_id: params.facultyId,
        class_id: params.classId
      });
      const res = await fetch(`${API_BASE}/timetable/check-conflict?${qs.toString()}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Attendance & Lectures
  async getStudentAttendance() {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/attendance/student`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getFacultyAttendance() {
    try {
      const res = await fetch(`${API_BASE}/attendance/faculty`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async createLecture(lectureData: any) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/lectures/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(lectureData)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async markAttendance(lectureId: number, attendanceList: { student_id: string; status: string }[]) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ lecture_id: lectureId, attendance: attendanceList })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Assignments
  async getAssignments() {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/assignments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async submitAssignment(assignmentId: string, submissionFile: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ submission_file: submissionFile })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Quizzes & AI Report
  async getQuizzes() {
    try {
      const res = await fetch(`${API_BASE}/quizzes`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getQuizQuestions(quizId: string) {
    try {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async submitQuiz(quizId: string, answers: Record<string, number>) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ answers })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAIReport(quizId: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/ai-report/${quizId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Announcements & Notifications
  async getAnnouncements() {
    try {
      const res = await fetch(`${API_BASE}/announcements`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async createAnnouncement(data: { title: string; content: string; audience: string; type: string }) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getNotifications() {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async markNotificationRead(id: string) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Events & Calendar
  async getCalendar(category?: string) {
    try {
      const url = category && category !== 'All' ? `${API_BASE}/calendar?category=${category}` : `${API_BASE}/calendar`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getEvents() {
    try {
      const res = await fetch(`${API_BASE}/events`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async createEvent(eventData: any) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(eventData)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Forums
  async getForums(courseCode?: string) {
    try {
      const url = courseCode ? `${API_BASE}/forums?course_code=${courseCode}` : `${API_BASE}/forums`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  },

  async createForumTopic(courseId: string, title: string, content: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/forums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ course_id: courseId, title, content })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getForumReplies(topicId: string) {
    try {
      const res = await fetch(`${API_BASE}/forums/${topicId}/replies`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async postForumReply(topicId: string, content: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/forums/${topicId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Grievances
  async getGrievances() {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/grievances`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async submitGrievance(subject: string, category: string, description: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/grievances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ subject, category, description })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateGrievance(id: string, status: string, resolution?: string) {
    try {
      const token = localStorage.getItem('smartclass_token');
      const res = await fetch(`${API_BASE}/grievances/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, resolution })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Dashboard Stats
  async getDashboardStats(role: string) {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats?role=${role}`);
      return await res.json();
    } catch {
      return null;
    }
  }
};
