import React, { useEffect, useState } from 'react';
import { Clock, HelpCircle, CheckCircle } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface QuizItem {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  questions: number;
  duration: number;
  opens: string;
  closes: string;
  status: string;
  topics: string[];
}

interface Question {
  id: number;
  question: string;
  options: string[];
  topic: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getQuizzes().then(setQuizzes).catch(err => setError(err.message));
  }, []);

  async function openQuiz(quiz: QuizItem) {
    try {
      setQuestions(await api.getQuizQuestions(quiz.id));
      setActiveQuiz(quiz);
      setAnswers({});
      setResult(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitQuiz() {
    if (!activeQuiz) return;
    try {
      setResult(await api.submitQuiz(activeQuiz.id, answers));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (activeQuiz) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setActiveQuiz(null)} className="text-sm text-[#2F4F3A] font-semibold">← Back to quizzes</button>
        <SectionHeader title={activeQuiz.title} sub={`${activeQuiz.courseCode} · ${activeQuiz.duration} minutes`} />
        {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
        {result ? (
          <Card className="p-8 text-center"><CheckCircle size={32} className="mx-auto text-[#2F4F3A]" /><p className="text-2xl font-bold mt-3">{result.score}/{result.total}</p><p className="text-sm text-[#7a6a55]">Official deterministic score</p></Card>
        ) : (
          <>
            {questions.map((question, questionIndex) => (
              <Card key={question.id} className="p-5 space-y-3">
                <div className="flex justify-between"><p className="font-semibold">{questionIndex + 1}. {question.question}</p><Badge variant="info">{question.topic}</Badge></div>
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-[#F4F1E6]"><input type="radio" name={`question-${question.id}`} checked={answers[String(question.id)] === optionIndex} onChange={() => setAnswers(current => ({ ...current, [String(question.id)]: optionIndex }))} />{option}</label>
                ))}
              </Card>
            ))}
            <Button variant="primary" onClick={() => void submitQuiz()}>Submit Quiz</Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <SectionHeader title="Quizzes" sub="Objective quizzes for your enrolled courses" />
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      <div className="space-y-3">
        {quizzes.map(quiz => (
          <Card key={quiz.id} className="p-5 flex items-center gap-4">
            <HelpCircle size={20} className="text-[#2F4F3A]" />
            <div className="flex-1"><p className="font-bold text-[#1a2e1e]">{quiz.title}</p><p className="text-xs text-[#7a6a55]">{quiz.courseCode} · {quiz.questions} questions · <Clock size={11} className="inline" /> {quiz.duration} minutes</p></div>
            <Badge variant="info">{quiz.status}</Badge>
            <Button size="sm" variant="primary" onClick={() => void openQuiz(quiz)}>Open</Button>
          </Card>
        ))}
        {!quizzes.length && !error && <EmptyState icon={HelpCircle} message="No quizzes." sub="No database-backed quizzes are available." />}
      </div>
    </div>
  );
}
