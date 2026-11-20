import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Select, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Draft { question_text: string; options: string[]; correct_option: number; marks: string; topic: string }
const blankQuestion = (): Draft => ({ question_text: '', options: ['', '', '', ''], correct_option: 0, marks: '1', topic: 'General' });

function localInput(offsetHours: number) {
  const d = new Date(Date.now() + offsetHours * 3600_000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function QuizAuthor({ onDone }: { onDone: () => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('15');
  const [attempts, setAttempts] = useState('1');
  const [opens, setOpens] = useState(localInput(0));
  const [closes, setCloses] = useState(localInput(24 * 7));
  const [release, setRelease] = useState(true);
  const [questions, setQuestions] = useState<Draft[]>([blankQuestion()]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getClasses()]).then(([co, cl]) => {
      setCourses(co); setClasses(cl); setCourseId(co[0]?.id || '');
    }).catch(e => setError(e.message));
  }, []);

  const update = (i: number, patch: Partial<Draft>) =>
    setQuestions(qs => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOption = (i: number, o: number, value: string) =>
    setQuestions(qs => qs.map((q, idx) => (idx === i ? { ...q, options: q.options.map((x, k) => (k === o ? value : x)) } : q)));

  const valid = title.trim().length >= 3 && courseId && selected.length > 0 && questions.every(q =>
    q.question_text.trim() && q.options.every(o => o.trim()));

  async function save() {
    setBusy(true); setError('');
    try {
      await api.createQuiz({
        course_id: courseId, class_ids: selected, title, duration_minutes: Number(duration) || 15,
        opens_at: opens, closes_at: closes, max_attempts: Number(attempts) || 1, is_released: release,
        questions: questions.map(q => ({ ...q, marks: Number(q.marks) || 1 })),
      });
      onDone();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <button onClick={onDone} className="text-sm text-[#2F4F3A] font-semibold">← Back to quizzes</button>
      <SectionHeader title="Create Quiz" sub="Objective questions are scored deterministically from your answer key" />
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      <Card className="p-5 space-y-4">
        <Input label="Title" value={title} onChange={setTitle} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Select label="Course" value={courseId} onChange={setCourseId} options={courses.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
          <Input label="Duration (minutes)" type="number" value={duration} onChange={setDuration} />
          <Input label="Max attempts" type="number" value={attempts} onChange={setAttempts} />
          <Input label="Opens" type="datetime-local" value={opens} onChange={setOpens} />
          <Input label="Closes" type="datetime-local" value={closes} onChange={setCloses} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4a3a2a] mb-2">Classes</p>
          <div className="flex gap-4 flex-wrap">{classes.map(c => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(c.id)}
                onChange={e => setSelected(s => (e.target.checked ? [...s, c.id] : s.filter(x => x !== c.id)))} />{c.id}
            </label>))}</div>
          <p className="text-xs text-[#9a8a75] mt-1">PEC courses reach only students enrolled in that elective.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={release} onChange={e => setRelease(e.target.checked)} />Release to students immediately (untick to save as draft)</label>
      </Card>
      {questions.map((q, i) => (
        <Card key={i} className="p-5 space-y-3">
          <div className="flex justify-between items-center"><h3 className="font-bold">Question {i + 1}</h3>
            {questions.length > 1 && <Button size="sm" variant="ghost" onClick={() => setQuestions(qs => qs.filter((_, k) => k !== i))}>Remove</Button>}</div>
          <textarea value={q.question_text} onChange={e => update(i, { question_text: e.target.value })} rows={2} placeholder="Question text"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm" />
          {q.options.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <input type="radio" name={`correct-${i}`} checked={q.correct_option === k} onChange={() => update(i, { correct_option: k })} title="Correct answer" />
              <input value={o} onChange={e => setOption(i, k, e.target.value)} placeholder={`Option ${k + 1}`}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm" />
            </div>))}
          <div className="grid grid-cols-2 gap-3"><Input label="Topic" value={q.topic} onChange={v => update(i, { topic: v })} />
            <Input label="Marks" type="number" value={q.marks} onChange={v => update(i, { marks: v })} /></div>
          <p className="text-xs text-[#9a8a75]">Select the radio button beside the correct option.</p>
        </Card>))}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setQuestions(qs => [...qs, blankQuestion()])}>+ Add question</Button>
        <Button onClick={save} disabled={!valid || busy}>{busy ? 'Saving…' : 'Create quiz'}</Button>
      </div>
    </div>
  );
}
