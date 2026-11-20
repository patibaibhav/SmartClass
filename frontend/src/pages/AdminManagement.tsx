import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Input, Select, SectionHeader, Modal } from '../components/ui';
import { api } from '../services/api';

type Tab = 'users' | 'classes';

function SecretNotice({ title, value, onClose }: { title: string; value: string; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-[#7a6a55] mb-3">
        Share this temporary password securely. It is shown only once; the user must change it at first login.
      </p>
      <code className="block p-3 rounded-xl bg-[#F4F1E6] border border-[#E8E2D0] text-sm break-all select-all">{value}</code>
      <div className="mt-4"><Button onClick={onClose}>Done</Button></div>
    </Modal>
  );
}

export default function AdminManagement({ initialTab = 'users' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [secret, setSecret] = useState<{ title: string; value: string } | null>(null);

  // users
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ role: 'student', name: '', class_id: 'D12A', roll_no: '', email: '', council: '' });
  const [newClass, setNewClass] = useState({ id: '', name: '' });
  const [newCourse, setNewCourse] = useState({ id: '', name: '', credits: '3' });
  const [assign, setAssign] = useState({ class_id: '', course_id: '', faculty_id: '' });
  const [faculty, setFaculty] = useState<any[]>([]);

  const wrap = async (fn: () => Promise<void>, ok?: string) => {
    setError(''); setMessage('');
    try { await fn(); if (ok) setMessage(ok); } catch (e: any) { setError(e.message); }
  };
  const loadUsers = () => api.adminListUsers(roleFilter || undefined, search || undefined).then(setUsers);
  const loadStructure = async () => {
    const [cl, co, as, fa] = await Promise.all([
      api.adminListClasses(), api.adminListCourses(), api.adminListAssignments(), api.adminListUsers('faculty'),
    ]);
    setClasses(cl); setCourses(co); setAssignments(as); setFaculty(fa);
    setAssign(a => ({
      class_id: a.class_id || cl[0]?.id || '', course_id: a.course_id || co[0]?.id || '',
      faculty_id: a.faculty_id || fa[0]?.id || '',
    }));
  };
  useEffect(() => { void wrap(async () => { await Promise.all([loadUsers(), loadStructure()]); }); }, []);
  useEffect(() => { void wrap(async () => { await loadUsers(); }); }, [roleFilter]);

  const createUser = () => wrap(async () => {
    const res = await api.adminCreateUser({
      role: newUser.role, name: newUser.name, email: newUser.email || null,
      class_id: newUser.role === 'student' ? newUser.class_id : null,
      roll_no: newUser.role === 'student' ? newUser.roll_no : null,
      council: newUser.role === 'council' ? newUser.council : null,
    });
    setSecret({ title: `Account created: ${res.user.id}`, value: res.temporaryPassword });
    setNewUser({ ...newUser, name: '', roll_no: '', email: '', council: '' });
    await loadUsers();
  });
  const resetPassword = (id: string) => wrap(async () => {
    if (!window.confirm(`Issue a new temporary password for ${id}? Their sessions will be signed out.`)) return;
    const res = await api.adminResetPassword(id);
    setSecret({ title: `Temporary password for ${id}`, value: res.temporaryPassword });
  });
  const toggleActive = (u: any) => wrap(async () => {
    await api.adminUpdateUser(u.id, { is_active: !u.isActive });
    await loadUsers();
  }, `${u.id} ${u.isActive ? 'deactivated' : 'reactivated'}.`);
  const moveStudent = (u: any, classId: string) => wrap(async () => {
    await api.adminUpdateUser(u.id, { class_id: classId });
    await loadUsers();
  }, `${u.id} moved to ${classId}.`);

  const classOptions = classes.map(c => ({ value: c.id, label: c.id }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <SectionHeader title={tab === 'users' ? 'User Management' : 'Classes, Courses & Faculty Assignment'}
        sub="Every action is stored in the shared database and written to the audit log" />
      <div className="flex gap-2">
        <Button variant={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>Users</Button>
        <Button variant={tab === 'classes' ? 'primary' : 'secondary'} onClick={() => setTab('classes')}>Classes & Courses</Button>
      </div>
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      {message && <Card className="p-4 text-sm text-[#1a6b3c]">{message}</Card>}
      {secret && <SecretNotice title={secret.title} value={secret.value} onClose={() => setSecret(null)} />}

      {tab === 'users' && <>
        <Card className="p-5 space-y-3">
          <h3 className="font-bold">Create account</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select label="Role" value={newUser.role} onChange={v => setNewUser({ ...newUser, role: v })}
              options={[{ value: 'student', label: 'Student' }, { value: 'faculty', label: 'Faculty' }, { value: 'council', label: 'Council Head' }]} />
            <Input label="Full name" value={newUser.name} onChange={v => setNewUser({ ...newUser, name: v })} />
            {newUser.role === 'student' && <>
              <Select label="Class" value={newUser.class_id} onChange={v => setNewUser({ ...newUser, class_id: v })} options={classOptions} />
              <Input label="Roll no." value={newUser.roll_no} onChange={v => setNewUser({ ...newUser, roll_no: v })} />
            </>}
            {newUser.role === 'council' && <Input label="Council name" value={newUser.council} onChange={v => setNewUser({ ...newUser, council: v })} />}
            <Input label="Email (optional)" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} />
          </div>
          <Button onClick={createUser} disabled={!newUser.name || (newUser.role === 'student' && !newUser.roll_no) || (newUser.role === 'council' && !newUser.council)}>Create account</Button>
        </Card>
        <Card className="p-5 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <Select label="Role" value={roleFilter} onChange={setRoleFilter}
              options={[{ value: '', label: 'All' }, { value: 'student', label: 'Students' }, { value: 'faculty', label: 'Faculty' }, { value: 'admin', label: 'Admins' }, { value: 'council', label: 'Council' }]} />
            <Input label="Search name or ID" value={search} onChange={setSearch} />
            <Button variant="secondary" onClick={() => void wrap(async () => { await loadUsers(); })}>Search</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-[#7a6a55]"><th className="py-2">ID</th><th>Name</th><th>Role</th><th>Class</th><th>Status</th><th /></tr></thead>
              <tbody>{users.map(u => (
                <tr key={u.id} className="border-t border-[#E8E2D0]">
                  <td className="py-2 font-mono text-xs">{u.id}</td>
                  <td>{u.name}{u.isHOD && <Badge variant="info" className="ml-2">HOD</Badge>}</td>
                  <td>{u.role}</td>
                  <td>{u.role === 'student'
                    ? <select value={u.classId || ''} onChange={e => void moveStudent(u, e.target.value)} className="bg-[#F4F1E6] rounded-lg px-2 py-1 border border-[#E8E2D0]">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                      </select> : '—'}</td>
                  <td><Badge variant={u.isActive ? 'available' : 'danger'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge></td>
                  <td className="space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="secondary" onClick={() => void resetPassword(u.id)}>Reset password</Button>
                    <Button size="sm" variant="outline" onClick={() => void toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Reactivate'}</Button>
                  </td>
                </tr>))}</tbody>
            </table>
            {!users.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No users match.</p>}
          </div>
        </Card>
      </>}

      {tab === 'classes' && <>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-5 space-y-3">
            <h3 className="font-bold">Classes</h3>
            {classes.map(c => <div key={c.id} className="flex justify-between items-center bg-[#F4F1E6] rounded-xl p-3 text-sm">
              <span><b>{c.id}</b> · {c.name} · {c.students} students</span>
              <Button size="sm" variant="outline" onClick={() => void wrap(async () => { await api.adminSaveClass({ id: c.id, name: c.name, department: c.department, is_active: !c.isActive }); await loadStructure(); })}>
                {c.isActive ? 'Deactivate' : 'Activate'}</Button></div>)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Input label="New class ID" value={newClass.id} onChange={v => setNewClass({ ...newClass, id: v })} />
              <Input label="Name" value={newClass.name} onChange={v => setNewClass({ ...newClass, name: v })} />
            </div>
            <Button disabled={!newClass.id || !newClass.name} onClick={() => void wrap(async () => { await api.adminSaveClass(newClass); setNewClass({ id: '', name: '' }); await loadStructure(); }, 'Class saved.')}>Add class</Button>
          </Card>
          <Card className="p-5 space-y-3">
            <h3 className="font-bold">Courses</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">{courses.map(c => <div key={c.id} className="flex justify-between items-center bg-[#F4F1E6] rounded-xl p-3 text-sm">
              <span><b>{c.code}</b> · {c.name}</span>
              <Button size="sm" variant="outline" onClick={() => void wrap(async () => { await api.adminSaveCourse({ id: c.id, code: c.code, name: c.name, department: c.department, credits: c.credits, is_active: !c.isActive }); await loadStructure(); })}>
                {c.isActive ? 'Deactivate' : 'Activate'}</Button></div>)}</div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Input label="Code" value={newCourse.id} onChange={v => setNewCourse({ ...newCourse, id: v })} />
              <Input label="Name" value={newCourse.name} onChange={v => setNewCourse({ ...newCourse, name: v })} />
              <Input label="Credits" type="number" value={newCourse.credits} onChange={v => setNewCourse({ ...newCourse, credits: v })} />
            </div>
            <Button disabled={!newCourse.id || !newCourse.name} onClick={() => void wrap(async () => { await api.adminSaveCourse({ id: newCourse.id, name: newCourse.name, credits: Number(newCourse.credits) || 3 }); setNewCourse({ id: '', name: '', credits: '3' }); await loadStructure(); }, 'Course saved.')}>Add course</Button>
          </Card>
        </div>
        <Card className="p-5 space-y-3">
          <h3 className="font-bold">Faculty ↔ Class ↔ Course assignments</h3>
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <Select label="Class" value={assign.class_id} onChange={v => setAssign({ ...assign, class_id: v })} options={classOptions} />
            <Select label="Course" value={assign.course_id} onChange={v => setAssign({ ...assign, course_id: v })} options={courses.map(c => ({ value: c.id, label: c.code }))} />
            <Select label="Faculty" value={assign.faculty_id} onChange={v => setAssign({ ...assign, faculty_id: v })} options={faculty.map(f => ({ value: f.id, label: f.name }))} />
            <Button onClick={() => void wrap(async () => { await api.adminAssign(assign); await loadStructure(); }, 'Faculty assigned.')}>Assign</Button>
          </div>
          <div className="max-h-80 overflow-y-auto grid sm:grid-cols-2 gap-2">{assignments.map(a => <div key={a.id} className="flex justify-between items-center bg-[#F4F1E6] rounded-xl p-3 text-sm">
            <span>{a.classId} · <b>{a.courseId}</b> · {a.facultyName || a.facultyId}</span>
            <Button size="sm" variant="danger" onClick={() => void wrap(async () => { if (!window.confirm('Remove this assignment?')) return; await api.adminUnassign(a.id); await loadStructure(); })}>Remove</Button></div>)}</div>
        </Card>
      </>}
    </div>
  );
}
