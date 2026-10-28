import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, HelpCircle, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props { role?: string }

export default function QuizzesPage({ role = 'student' }: Props) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getQuizzes().then(setQuizzes).catch(err => setError(err.message)); }, []);

  async function openQuiz(quiz: any) {
    setError('');
    try {
      const questionRows = await api.getQuizQuestions(quiz.id);
      setQuestions(questionRows); setActiveQuiz(quiz); setAnswers({}); setResult(null); setStarted(role !== 'student');
      if (role !== 'student') setAttempts(await api.getQuizAttempts(quiz.id));
    } catch (err: any) { setError(err.message); }
  }
  async function submitQuiz() {
    try { setResult(await api.submitQuiz(activeQuiz.id, answers)); setQuizzes(await api.getQuizzes()); }
    catch (err: any) { setError(err.message); }
  }

  if (activeQuiz) return <div className="p-6 max-w-4xl mx-auto space-y-5">
    <button onClick={() => setActiveQuiz(null)} className="text-sm text-[#2F4F3A] font-semibold">← Back to quizzes</button>
    <SectionHeader title={activeQuiz.title} sub={`${activeQuiz.courseCode} · ${activeQuiz.duration} minutes · ${activeQuiz.maxAttempts} attempt(s)`}/>
    {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
    {role === 'student' && !started ? <Card className="p-6 space-y-4"><h3 className="font-bold">Instructions</h3><ul className="list-disc pl-5 text-sm text-[#7a6a55] space-y-2"><li>Answer each objective question before submitting.</li><li>Your score is calculated from the stored answer key and question marks.</li><li>Submission is final and counts toward the attempt limit.</li><li>Available until {activeQuiz.closes}.</li></ul><Button onClick={() => setStarted(true)}>Start attempt</Button></Card> : role === 'student' ? result ? <Card className="p-8 text-center"><CheckCircle size={32} className="mx-auto text-[#2F4F3A]"/><p className="text-2xl font-bold mt-3">{result.score}/{result.total}</p><p className="text-sm text-[#7a6a55]">Attempt persisted and evaluated</p></Card> : <>{questions.map((question, index) => <Card key={question.id} className="p-5 space-y-3"><div className="flex justify-between gap-3"><p className="font-semibold">{index + 1}. {question.question}</p><Badge variant="info">{question.topic}</Badge></div>{question.options.map((option: string, optionIndex: number) => <label key={optionIndex} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-[#F4F1E6]"><input type="radio" name={`question-${question.id}`} checked={answers[String(question.id)] === optionIndex} onChange={() => setAnswers(current => ({...current,[String(question.id)]:optionIndex}))}/>{option}</label>)}</Card>)}<Button onClick={submitQuiz}>Submit quiz</Button></> : <div className="grid lg:grid-cols-2 gap-5"><Card className="p-5"><h3 className="font-bold mb-4">Question bank</h3><div className="space-y-3">{questions.map((question, index) => <div key={question.id} className="p-3 rounded-xl bg-[#F4F1E6]"><p className="text-sm font-semibold">{index + 1}. {question.question}</p><p className="text-xs text-[#1a6b3c] mt-1">Correct: {question.options[question.correctOption]} · {question.marks} mark(s)</p></div>)}</div></Card><Card className="p-5"><h3 className="font-bold mb-4">Student attempts</h3><div className="space-y-3">{attempts.map(attempt => <div key={attempt.id} className="flex justify-between p-3 rounded-xl bg-[#F4F1E6]"><div><p className="text-sm font-semibold">{attempt.studentName}</p><p className="text-xs text-[#7a6a55]">{attempt.studentId}</p></div><Badge variant="info">{attempt.score}/{attempt.total} · {attempt.percentage}%</Badge></div>)}{!attempts.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No attempts recorded.</p>}</div></Card></div>}
  </div>;

  return <div className="p-6 max-w-4xl mx-auto space-y-5"><SectionHeader title="Quizzes" sub={role === 'student' ? 'Objective quizzes for your enrolled courses' : 'Manage assigned quizzes and inspect attempts'}/>{error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}<div className="space-y-3">{quizzes.map(quiz => <Card key={quiz.id} className="p-5 flex items-center gap-4"><HelpCircle size={20} className="text-[#2F4F3A]"/><div className="flex-1"><p className="font-bold">{quiz.title}</p><p className="text-xs text-[#7a6a55]">{quiz.courseCode} · {quiz.questions} questions · <Clock size={11} className="inline"/> {quiz.duration} minutes{role === 'student' ? ` · ${quiz.attemptsUsed}/${quiz.maxAttempts} attempts` : ''}</p></div><Badge variant={quiz.status}>{quiz.status}</Badge><Button size="sm" onClick={() => void openQuiz(quiz)} disabled={role === 'student' && !quiz.canAttempt}>{role === 'student' ? 'Open' : 'Manage'}</Button></Card>)}{!quizzes.length && !error && <EmptyState icon={role === 'student' ? HelpCircle : Users} message="No quizzes." sub="No authorized database-backed quizzes are available."/>}</div></div>;
}
