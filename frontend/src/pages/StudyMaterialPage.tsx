import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Plus, Link, Upload } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, Modal, Input, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

interface CourseItem {
  id?: string;
  code: string;
  name: string;
  credits?: number;
  faculty?: string;
}

interface MaterialItem {
  id: string;
  course: string;
  unit: string;
  title: string;
  type: string;
  size?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  description?: string;
}

const FILE_ICONS: Record<string, string> = {
  PDF: '📄', PPT: '📊', DOC: '📝', IMG: '🖼️', LINK: '🔗',
};
const FILE_COLORS: Record<string, string> = {
  PDF: '#D98282', PPT: '#E8D36A', DOC: '#7DB7C9', IMG: '#9a7acc', LINK: '#2F4F3A',
};

export default function StudyMaterialPage({ role = 'student' }: Props) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourses().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setCourses(res);
        setSelectedCourse(res[0].code);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    api.getMaterials(selectedCourse)
      .then(res => {
        if (Array.isArray(res)) {
          setMaterials(res);
        } else {
          setMaterials([]);
        }
      })
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const units = [...new Set(materials.map(m => m.unit || 'General Resources'))];
  const activeCourse = courses.find(c => c.code === selectedCourse || c.id === selectedCourse);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader
        title="Study Material"
        sub="Course resources, lecture slides, and reference notes"
        action={role === 'faculty' ? (
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Upload size={14} /> Upload Material
          </Button>
        ) : undefined}
      />

      {/* Course selector */}
      <div className="flex gap-2 flex-wrap">
        {courses.map(c => (
          <button
            key={c.code}
            onClick={() => setSelectedCourse(c.code)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedCourse === c.code
                ? 'bg-[#2F4F3A] text-[#F4F1E6]'
                : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* Course header */}
      {activeCourse && (
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1a2e1e]">{activeCourse.name}</h3>
              <p className="text-xs text-[#7a6a55]">
                {activeCourse.code} {activeCourse.faculty ? `· ${activeCourse.faculty}` : ''} {activeCourse.credits ? `· ${activeCourse.credits} credits` : ''}
              </p>
            </div>
            <Badge variant="info">{materials.length} resources</Badge>
          </div>
        </Card>
      )}

      {/* Material by unit */}
      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading course materials...
        </Card>
      ) : units.length === 0 || materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          message="No study materials uploaded for this course yet."
          sub="Faculty will upload notes and reference materials during the term."
        />
      ) : (
        units.map(unit => (
          <div key={unit} className="space-y-3">
            <h4 className="text-sm font-bold text-[#1a2e1e] uppercase tracking-wide border-b border-[#E8E2D0] pb-2">{unit}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {materials.filter(m => (m.unit || 'General Resources') === unit).map(mat => (
                <Card key={mat.id} className="p-4 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: (FILE_COLORS[mat.type] || '#2F4F3A') + '20' }}
                  >
                    {FILE_ICONS[mat.type] || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1e] leading-snug">{mat.title}</p>
                    {mat.description && <p className="text-xs text-[#7a6a55] mt-0.5">{mat.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="default">{mat.type || 'DOCUMENT'}</Badge>
                      {mat.size && <span className="text-xs text-[#9a8a75]">{mat.size}</span>}
                      {mat.uploadedAt && <span className="text-xs text-[#9a8a75]">{mat.uploadedAt}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="p-1.5 rounded-lg hover:bg-[#E8E2D0] text-[#7a6a55] transition-colors" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-[#E8E2D0] text-[#7a6a55] transition-colors" title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {uploadOpen && (
        <Modal title="Upload Study Material" onClose={() => setUploadOpen(false)} width="max-w-lg">
          <div className="space-y-4">
            <Input label="Title" value={newTitle} onChange={setNewTitle} placeholder="e.g. Unit 1 Notes" required />
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                {courses.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setUploadOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
