import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Phone, Shield } from 'lucide-react';
import { Card, Badge, Tabs, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
  onNavigate?: (page: string) => void;
}

interface ClassCourse {
  code: string;
  name: string;
  credits: number | null;
  faculty: string | null;
  sessionKind?: string | null;
  batch?: string | null;
}

interface StudentItem {
  id: string;
  name: string;
  rollNo: string;
  mobile?: string | null;
}

interface ClassData {
  class: {
    id: string;
    name: string;
    year: string;
    department: string;
  };
  courses: ClassCourse[];
  students: StudentItem[];
  availableClasses?: string[];
}

export default function MyClassPage({ role = 'student', onNavigate }: Props) {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getMyClass(selectedClassId)
      .then(res => {
        if (!isMounted) return;
        if (res && res.class) {
          setClassData(res);
        } else {
          setError('Failed to load class information.');
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Error fetching class');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedClassId]);

  const tabs = role === 'student'
    ? ['Overview', 'Courses', 'Class Roster']
    : ['Overview', 'Courses', 'Students'];

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <SectionHeader title="My Class" sub="Loading class details..." />
        <div className="py-12 text-center text-[#7a6a55]">Loading class data...</div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <SectionHeader title="My Class" sub="Class information" />
        <Card className="p-8 text-center">
          <p className="text-sm text-[#b04040]">{error || 'No class found.'}</p>
        </Card>
      </div>
    );
  }

  const cls = classData.class;
  const availableClasses = classData.availableClasses || ['D12A', 'D12B', 'D12C'];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a2e1e]">{cls.name}</h2>
          <p className="text-sm text-[#7a6a55]">{cls.year} · {cls.department}</p>
        </div>

        {role !== 'student' && availableClasses.length > 1 && (
          <div className="flex gap-2">
            {availableClasses.map(cId => (
              <button
                key={cId}
                onClick={() => setSelectedClassId(cId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  (selectedClassId || cls.id) === cId
                    ? 'bg-[#2F4F3A] text-[#F4F1E6]'
                    : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
                }`}
              >
                {cId}
              </button>
            ))}
          </div>
        )}
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Overview' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 sm:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#1a2e1e]">Class Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Class ID', value: cls.id },
                { label: 'Year', value: cls.year },
                { label: 'Department', value: cls.department },
                { label: 'Enrolled Students', value: classData.students.length },
                { label: 'Active Courses', value: classData.courses.length },
                { label: 'Academic Year', value: '2024–25' },
              ].map(item => (
                <div key={item.label} className="bg-[#F4F1E6] rounded-xl p-3">
                  <p className="text-xs text-[#7a6a55]">{item.label}</p>
                  <p className="font-semibold text-[#1a2e1e] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-[#1a2e1e] mb-3">Class Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#7a6a55]">Total Students</span>
                <span className="font-bold text-[#2F4F3A]">{classData.students.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7a6a55]">Total Subjects</span>
                <span className="font-bold text-[#1a2e1e]">{classData.courses.length}</span>
              </div>
              <div className="pt-3 border-t border-[#E8E2D0] text-xs text-[#7a6a55]">
                <div className="flex items-center gap-1.5 text-[#2F4F3A]">
                  <Shield size={14} />
                  <span>Privacy protected roster</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Courses' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {classData.courses.length === 0 ? (
            <div className="col-span-2">
              <EmptyState title="No courses assigned" description="No course allocations found for this class." />
            </div>
          ) : (
            classData.courses.map((course, idx) => (
              <Card key={`${course.code}-${idx}`} className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="default">{course.code}</Badge>
                  {course.credits !== null && (
                    <span className="text-xs text-[#7a6a55]">{course.credits} credits</span>
                  )}
                </div>
                <p className="text-base font-bold text-[#1a2e1e]">{course.name}</p>
                <div className="text-xs text-[#7a6a55] space-y-1">
                  {course.faculty && <p>Faculty: <span className="font-medium text-[#1a2e1e]">{course.faculty}</span></p>}
                  {course.sessionKind && (
                    <p>Type: <span className="capitalize font-medium text-[#1a2e1e]">{course.sessionKind}</span>{course.batch ? ` (Batch ${course.batch})` : ''}</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {(activeTab === 'Students' || activeTab === 'Class Roster') && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-[#F5EBD7] border-b border-[#E8E2D0] flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1a2e1e]">Class Roster ({classData.students.length} Students)</h4>
            <span className="text-xs text-[#7a6a55]">Sorted by Roll Number</span>
          </div>
          <div className="overflow-x-auto">
            <table className="sc-table w-full">
              <thead>
                <tr>
                  <th className="w-20">Roll No.</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Mobile</th>
                </tr>
              </thead>
              <tbody>
                {classData.students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-bold text-[#2F4F3A]">{s.rollNo}</td>
                    <td className="font-medium text-[#1a2e1e]">{s.name}</td>
                    <td className="text-xs text-[#7a6a55]">{s.id}</td>
                    <td>
                      {s.mobile ? (
                        <span className="text-xs flex items-center gap-1 text-[#1a2e1e]">
                          <Phone size={12} className="text-[#2F4F3A]" /> {s.mobile}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9a8a75] italic">Hidden for privacy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
