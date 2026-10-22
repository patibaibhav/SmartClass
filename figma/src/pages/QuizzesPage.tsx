import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Flag, ChevronLeft, ChevronRight, BarChart2, Zap, AlertTriangle, BookOpen } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, Modal, ProgressBar } from '../components/ui';
import { QUIZZES, QUIZ_QUESTIONS, AI_REPORT } from '../data/mock';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Phase = 'list' | 'instructions' | 'quiz' | 'result' | 'ai-report';

export default function QuizzesPage() {
  const [phase, setPhase] = useState<Phase>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<typeof QUIZZES[0] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function startQuiz(quiz: typeof QUIZZES[0]) {
    setSelectedQuiz(quiz);
    setPhase('instructions');
    setAnswers({});
    setFlagged(new Set());
    setCurrentQ(0);
    setTimeLeft(quiz.duration * 60);
  }

  function submitQuiz() {
    setConfirmSubmit(false);
    setPhase('result');
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const score = Object.entries(answers).filter(([qi, ai]) => QUIZ_QUESTIONS[+qi].correct === ai).length;
  const unanswered = QUIZ_QUESTIONS.length - Object.keys(answers).length;

  if (phase === 'quiz') {
    const q = QUIZ_QUESTIONS[currentQ];
    const answered = Object.keys(answers).length;
    const pct = (answered / QUIZ_QUESTIONS.length) * 100;

    return (
      <div className="min-h-screen bg-[#F4F1E6] flex flex-col">
        {/* Quiz header */}
        <div className="bg-[#243B2D] px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[#F4F1E6] font-bold text-sm">{selectedQuiz?.title}</p>
            <p className="text-[#9abaaa] text-xs">{selectedQuiz?.course}</p>
          </div>
          <div className="flex items-center gap-2 bg-[#2F4F3A] rounded-xl px-4 py-2">
            <Clock size={15} className={timeLeft < 120 ? 'text-[#D98282]' : 'text-[#E8D36A]'} />
            <span className={`font-mono font-bold text-sm ${timeLeft < 120 ? 'text-[#D98282]' : 'text-[#F4F1E6]'}`}>{formatTime(timeLeft)}</span>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmSubmit(true)}>Submit Quiz</Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
                <button
                  onClick={() => setFlagged(f => { const n = new Set(f); n.has(currentQ) ? n.delete(currentQ) : n.add(currentQ); return n; })}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${flagged.has(currentQ) ? 'bg-[#fdf6e0] text-[#9a6000]' : 'text-[#9a8a75] hover:bg-[#E8E2D0]'}`}
                >
                  <Flag size={11} /> {flagged.has(currentQ) ? 'Flagged' : 'Flag'}
                </button>
              </div>

              <Card className="p-6">
                <p className="text-base font-semibold text-[#1a2e1e] leading-relaxed">{q.question}</p>
              </Card>

              <div className="space-y-2.5">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswers(a => ({ ...a, [currentQ]: i }))}
                    className={`quiz-option w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-sm ${
                      answers[currentQ] === i ? 'selected border-[#2F4F3A] bg-[rgba(47,79,58,0.08)] text-[#1a2e1e] font-medium' :
                      'border-[#E8E2D0] bg-[#F5EBD7] text-[#3a2e1a] hover:border-[#7DB7C9]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${answers[currentQ] === i ? 'bg-[#2F4F3A] border-[#2F4F3A] text-[#F4F1E6]' : 'border-[#E8E2D0] text-[#7a6a55]'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>
                  <ChevronLeft size={16} /> Previous
                </Button>
                <Button variant="primary" onClick={() => currentQ < QUIZ_QUESTIONS.length - 1 ? setCurrentQ(q => q + 1) : setConfirmSubmit(true)}>
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? <>Next <ChevronRight size={16} /></> : 'Submit Quiz'}
                </Button>
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <div className="w-52 bg-[#F5EBD7] border-l border-[#E8E2D0] p-4 overflow-y-auto shrink-0 hidden md:block">
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Questions</p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {QUIZ_QUESTIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    i === currentQ ? 'bg-[#2F4F3A] text-[#F4F1E6]' :
                    flagged.has(i) ? 'bg-[#fdf6e0] text-[#9a6000] border border-[#E8D36A]' :
                    answers[i] !== undefined ? 'bg-[#e6f4ec] text-[#1a6b3c]' :
                    'bg-[#E8E2D0] text-[#7a6a55]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 text-xs">
              {[['Answered', 'bg-[#e6f4ec] border border-[#c0e0cd]', Object.keys(answers).length],
                ['Flagged', 'bg-[#fdf6e0] border border-[#E8D36A]', flagged.size],
                ['Unanswered', 'bg-[#E8E2D0]', QUIZ_QUESTIONS.length - Object.keys(answers).length]
              ].map(([label, cls, count]) => (
                <div key={String(label)} className={`flex items-center justify-between px-2 py-1 rounded-lg ${cls}`}>
                  <span className="text-[#3a2e1a]">{label}</span>
                  <span className="font-bold text-[#1a2e1e]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {confirmSubmit && (
          <Modal title="Submit Quiz" onClose={() => setConfirmSubmit(false)}>
            <div className="space-y-4">
              {unanswered > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fdf6e0] border border-[#f0df90]">
                  <AlertTriangle size={16} className="text-[#9a6000]" />
                  <p className="text-sm text-[#7a4a00]">You have <strong>{unanswered} unanswered</strong> question{unanswered > 1 ? 's' : ''}. Submit anyway?</p>
                </div>
              )}
              {unanswered === 0 && <p className="text-sm text-[#3a2e1a]">All questions answered. Ready to submit?</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Review Answers</Button>
                <Button variant="primary" onClick={submitQuiz}>Submit Quiz</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (phase === 'result') {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('list')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Quizzes</button>
        </div>

        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2F4F3A] text-[#F4F1E6] text-2xl font-bold mb-4">
            {pct}%
          </div>
          <h2 className="text-xl font-bold text-[#1a2e1e] mb-1">{selectedQuiz?.title}</h2>
          <p className="text-sm text-[#7a6a55]">Official Result</p>
          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-[#E8E2D0]">
            <div><p className="text-2xl font-bold text-[#2F4F3A]">{score}</p><p className="text-xs text-[#7a6a55]">Correct</p></div>
            <div><p className="text-2xl font-bold text-[#D98282]">{QUIZ_QUESTIONS.length - score - unanswered}</p><p className="text-xs text-[#7a6a55]">Incorrect</p></div>
            <div><p className="text-2xl font-bold text-[#9a8a75]">{unanswered}</p><p className="text-xs text-[#7a6a55]">Unattempted</p></div>
          </div>
        </Card>

        <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-2xl p-4 text-xs text-[#7a4a00]">
          <p className="font-semibold mb-0.5">Official Result</p>
          <p>This score is calculated deterministically from your responses. AI analysis is advisory only and does not affect your marks.</p>
        </div>

        <Button variant="primary" className="w-full justify-center" onClick={() => setPhase('ai-report')}>
          <Zap size={15} /> View AI Performance Analysis
        </Button>
      </div>
    );
  }

  if (phase === 'ai-report') {
    const r = AI_REPORT;
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setPhase('result')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Result</button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
            <Zap size={18} className="text-[#E8D36A]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a2e1e]">AI Test Performance Analysis</h2>
            <p className="text-xs text-[#7a6a55]">{r.quizTitle} — Advisory Report</p>
          </div>
        </div>

        <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-2xl p-3 flex items-start gap-2 text-xs text-[#7a4a00]">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <p>AI-generated insights are advisory and do not affect your official academic result. Official score: <strong>{r.score}%</strong>.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle size={13} className="text-[#2F4F3A]" /> Strengths
            </p>
            <ul className="space-y-1.5">
              {r.strengths.map(s => (
                <li key={s} className="flex items-center gap-2 text-sm text-[#1a2e1e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F4F3A] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 size={13} className="text-[#D98282]" /> Needs Improvement
            </p>
            <ul className="space-y-1.5">
              {r.improvements.map(s => (
                <li key={s} className="flex items-center gap-2 text-sm text-[#1a2e1e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D98282] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Topic Performance</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.topicPerformance} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#7a6a55' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: '#3a2e1a' }} width={110} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {r.topicPerformance.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 80 ? '#2F4F3A' : entry.score >= 70 ? '#7DB7C9' : '#D98282'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen size={13} className="text-[#2F4F3A]" /> Suggested Revision
          </p>
          <ol className="space-y-2">
            {r.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#3a2e1a]">
                <span className="w-5 h-5 rounded-full bg-[#2F4F3A] text-[#F4F1E6] text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    );
  }

  if (phase === 'instructions' && selectedQuiz) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => setPhase('list')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back</button>
        <Card className="p-8 space-y-5">
          <div>
            <Badge variant={selectedQuiz.status as any}>{selectedQuiz.status.charAt(0).toUpperCase() + selectedQuiz.status.slice(1)}</Badge>
            <h2 className="text-xl font-bold text-[#1a2e1e] mt-2">{selectedQuiz.title}</h2>
            <p className="text-sm text-[#7a6a55]">{selectedQuiz.course} — {selectedQuiz.courseCode}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['Questions', selectedQuiz.questions], ['Duration', `${selectedQuiz.duration} minutes`], ['Opens', selectedQuiz.opens], ['Closes', selectedQuiz.closes]].map(([k, v]) => (
              <div key={String(k)} className="bg-[#F4F1E6] rounded-xl p-3">
                <p className="text-xs text-[#7a6a55]">{k}</p>
                <p className="text-sm font-semibold text-[#1a2e1e] mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-2">Topics Covered</p>
            <div className="flex gap-2 flex-wrap">{(selectedQuiz.topics || []).map(t => <span key={t} className="px-2.5 py-1 bg-[#E8E2D0] rounded-full text-xs text-[#3a2e1a]">{t}</span>)}</div>
          </div>
          <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-4 text-xs text-[#7a4a00] space-y-1">
            <p className="font-semibold">Instructions</p>
            <p>• You must complete the quiz within the time limit.</p>
            <p>• Each question has one correct answer.</p>
            <p>• You can flag questions to revisit them before submitting.</p>
            <p>• Once submitted, you cannot change your answers.</p>
          </div>
          <Button variant="primary" className="w-full justify-center py-3" onClick={() => setPhase('quiz')}>
            Start Quiz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Quizzes" sub="Online quizzes and tests for your enrolled courses" />
      <div className="space-y-3">
        {QUIZZES.map(q => (
          <Card key={q.id} className="p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={q.status as any}>{q.status.charAt(0).toUpperCase() + q.status.slice(1)}</Badge>
                <span className="text-xs text-[#9a8a75]">{q.courseCode}</span>
              </div>
              <p className="text-sm font-bold text-[#1a2e1e]">{q.title}</p>
              <div className="flex gap-3 text-xs text-[#7a6a55] mt-1 flex-wrap">
                <span>{q.questions} questions</span>
                <span>{q.duration} min</span>
                {q.status === 'completed' && <span className="text-[#2F4F3A] font-semibold">{q.score}/{q.total} correct</span>}
                {q.status !== 'completed' && <span>Opens {q.opens}</span>}
              </div>
            </div>
            {q.status === 'available' && (
              <Button variant="primary" size="sm" onClick={() => startQuiz(q)}>Start Quiz</Button>
            )}
            {q.status === 'completed' && (
              <Button variant="secondary" size="sm" onClick={() => { setSelectedQuiz(q); setPhase('result'); }}>View Result</Button>
            )}
            {q.status === 'upcoming' && (
              <span className="text-xs text-[#9a8a75] shrink-0">Not yet open</span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
