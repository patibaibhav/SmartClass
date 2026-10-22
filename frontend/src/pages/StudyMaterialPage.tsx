import React, { useState } from 'react';
import { FileText, Download, Eye, Plus, Link, Upload } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, Modal, Input, EmptyState } from '../components/ui';
import { STUDY_MATERIALS, COURSES } from '../data/mock';

interface Props {
  role?: string;
}

const FILE_ICONS: Record<string, string> = {
  PDF: '📄', PPT: '📊', DOC: '📝', IMG: '🖼️', LINK: '🔗',
};
const FILE_COLORS: Record<string, string> = {
  PDF: '#D98282', PPT: '#E8D36A', DOC: '#7DB7C9', IMG: '#9a7acc', LINK: '#2F4F3A',
};

export default function StudyMaterialPage({ role = 'student' }: Props) {
  const [selectedCourse, setSelectedCourse] = useState('CS302');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const courseMaterials = STUDY_MATERIALS.filter(m => m.course === selectedCourse);
  const units = [...new Set(courseMaterials.map(m => m.unit))];
  const course = COURSES.find(c => c.id === selectedCourse);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader
        title="Study Material"
        sub="Course resources and lecture notes"
        action={role === 'faculty' ? (
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Upload size={14} /> Upload Material
          </Button>
        ) : undefined}
      />

      {/* Course selector */}
      <div className="flex gap-2 flex-wrap">
        {COURSES.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCourse === c.id ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'}`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* Course header */}
      {course && (
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1a2e1e]">{course.name}</h3>
              <p className="text-xs text-[#7a6a55]">{course.code} · {course.faculty} · {course.credits} credits</p>
            </div>
            <Badge variant="info">{courseMaterials.length} resources</Badge>
          </div>
        </Card>
      )}

      {/* Material by unit */}
      {units.length === 0 ? (
        <EmptyState icon={FileText} message="No materials have been uploaded for this course yet." sub="Check back after your faculty uploads resources." />
      ) : (
        units.map(unit => (
          <div key={unit} className="space-y-3">
            <h4 className="text-sm font-bold text-[#1a2e1e] uppercase tracking-wide border-b border-[#E8E2D0] pb-2">{unit}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {courseMaterials.filter(m => m.unit === unit).map(mat => (
                <Card key={mat.id} className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: FILE_COLORS[mat.type] + '20' }}>
                    {FILE_ICONS[mat.type] || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1e] leading-snug">{mat.title}</p>
                    <p className="text-xs text-[#7a6a55] mt-0.5">{mat.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="default">{mat.type}</Badge>
                      <span className="text-xs text-[#9a8a75]">{mat.size}</span>
                      <span className="text-xs text-[#9a8a75]">{mat.uploadedAt}</span>
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
            <Input label="Title" value={newTitle} onChange={setNewTitle} placeholder="e.g. Indexing and B+ Trees — Lecture Notes" required />
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                {COURSES.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Unit / Topic</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" placeholder="e.g. Unit 3" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Type</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                  {['PDF', 'PPT', 'DOC', 'Image', 'Link'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Description</label>
              <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Brief description of this material..." />
            </div>
            <div className="border-2 border-dashed border-[#E8E2D0] rounded-xl p-6 text-center cursor-pointer hover:border-[#7DB7C9] transition-colors">
              <Upload size={20} className="text-[#7a6a55] mx-auto mb-2" />
              <p className="text-sm text-[#7a6a55]">Click to upload file</p>
              <p className="text-xs text-[#9a8a75] mt-0.5">Or paste a link below</p>
            </div>
            <Input label="External Link (optional)" value="" onChange={() => {}} placeholder="https://..." />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setUploadOpen(false)}>Upload</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
