import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Flag, ChevronLeft, ChevronRight, BarChart2, Zap, AlertTriangle, BookOpen } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, Modal, ProgressBar, EmptyState } from '../components/ui';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Phase = 'list' | 'instructions' | 'quiz' | 'result' | 'ai-report';

interface QuizItem {
  id: string;
  title: string;
  course?: string;
  courseCode?: string;
  questions?: number;
  duration: number;
  status: string;
  opens?: string;
  closes?: string;
  topics?: string[];
  score?: number;
  total?: number;
}

interface QuestionItem {
  question: string;
  options: string[];
  correct?: number;
}

export default function QuizzesPage() {
  const [phase, setPhase] = useState<Phase>('list');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getQuizzes()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setQuizzes(res);
        } else {
          setQuizzes([]);
        }
      })
      .catch(() => {
        if (isMounted) setQuizzes([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [phase]);

  async function startQuiz(quiz: QuizItem) {
    setSelectedQuiz(quiz);
    setAnswers({});
    setFlagged(new Set());
    setCurrentQ(0);
    setTimeLeft((quiz.duration || 15) * 60);

    const qList = await api.getQuizQuestions(quiz.id);
    if (Array.isArray(qList) && qList.length > 0) {
      setQuestions(qList);
    } else {
      setQuestions([]);
    }
    setPhase('instructions');
  }

  async function submitQuiz() {
    setConfirmSubmit(false);
    if (selectedQuiz) {
      const res = await api.submitQuiz(selectedQuiz.id, answers);
      if (res && res.score !== undefined) {
        setQuizScore({ score: res.score, total: res.total || questions.length });
      } else {
        const localScore = Object.entries(answers).filter(([qi, ai]) => questions[+qi]?.correct === ai).length;
        setQuizScore({ score: localScore, total: questions.length });
      }
    }
    setPhase('result');
  }

  async function loadAIReport() {
    if (!selectedQuiz) return;
    const report = await api.getAIReport(selectedQuiz.id);
    setAiReport(report);
    setPhase('ai-report');
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const unanswered = questions.length - Object.keys(answers).length;

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    const pct = (answered / questions.length) * 100;

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
                <span className="text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">Question {currentQ + 1} of {questions.length}</span>
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

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" size="sm" onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}>
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button variant="primary" size="sm" onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))} disabled={currentQ === questions.length - 1}>
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {confirmSubmit && (
          <Modal title="Submit Quiz" onClose={() => setConfirmSubmit(false)}>
            <div className="space-y-4">
              <p className="text-sm text-[#3a2e1a]">Are you ready to submit your answers?</p>
              {unanswered > 0 && (
                <div className="flex items-center gap-2 p-3 bg-[#fdf6e0] rounded-xl text-xs text-[#7a4a00]">
                  <AlertTriangle size={14} />
                  <span>You have <strong>{unanswered} unanswered</strong> question{unanswered > 1 ? 's' : ''}.</span>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Keep Working</Button>
                <Button variant="danger" onClick={submitQuiz}>Submit Now</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (phase === 'result') {
    const finalScore = quizScore?.score ?? 0;
    const finalTotal = quizScore?.total ?? questions.length;
    const scorePct = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => setPhase('list')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← All Quizzes</button>
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#e6f4ec] flex items-center justify-center mx-auto text-[#1a6b3c]">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#1a2e1e]">Quiz Completed</h2>
          <p className="text-3xl font-bold text-[#2F4F3A]">{finalScore} / {finalTotal} ({scorePct}%)</p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="primary" onClick={loadAIReport}>
              <Zap size={14} /> View AI Performance Analysis
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'ai-report') {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setPhase('result')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Result</button>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F4F3A] flex items-center justify-center text-[#E8D36A]">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a2e1e]">AI Performance Report</h2>
              <p className="text-xs text-[#7a6a55]">Personalized diagnostic breakdown</p>
            </div>
          </div>
          {aiReport ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[#3a2e1a]">{aiReport.summary || 'Assessment analysis complete.'}</p>
              {Array.isArray(aiReport.suggestions) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#7a6a55] uppercase tracking-wider">Suggested Areas to Focus:</p>
                  <ul className="list-disc pl-5 text-xs text-[#3a2e1a] space-y-1">
                    {aiReport.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#7a6a55]">Diagnostic metrics recorded in student profile.</p>
          )}
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
            <Badge variant="default">{selectedQuiz.status ? selectedQuiz.status.toUpperCase() : 'ACTIVE'}</Badge>
            <h2 className="text-xl font-bold text-[#1a2e1e] mt-2">{selectedQuiz.title}</h2>
            <p className="text-sm text-[#7a6a55]">{selectedQuiz.course || selectedQuiz.courseCode}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F4F1E6] rounded-xl p-3">
              <p className="text-xs text-[#7a6a55]">Questions</p>
              <p className="text-sm font-semibold text-[#1a2e1e] mt-0.5">{questions.length || selectedQuiz.questions || 5}</p>
            </div>
            <div className="bg-[#F4F1E6] rounded-xl p-3">
              <p className="text-xs text-[#7a6a55]">Duration</p>
              <p className="text-sm font-semibold text-[#1a2e1e] mt-0.5">{selectedQuiz.duration || 15} minutes</p>
            </div>
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
      <SectionHeader title="Quizzes" sub="Online assessments and test modules" />
      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading quizzes...
        </Card>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="No active quizzes scheduled at this time."
          sub="Your professors will open quizzes as units are completed."
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => (
            <Card key={q.id} className="p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="default">{q.status ? q.status.toUpperCase() : 'ACTIVE'}</Badge>
                  <span className="text-xs text-[#9a8a75]">{q.courseCode || q.course}</span>
                </div>
                <p className="text-sm font-bold text-[#1a2e1e]">{q.title}</p>
                <div className="flex gap-3 text-xs text-[#7a6a55] mt-1 flex-wrap">
                  <span>{q.duration || 15} min duration</span>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => startQuiz(q)}>Start Quiz</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
