import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { Card, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

export default function ResultsPage({ role = 'student' }: Props) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getResults()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setResults(res);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        if (isMounted) setResults([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Academic Results" sub="Official semester performance, marks, and grade sheets" />

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading results...
        </Card>
      ) : results.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8E2D0] flex items-center justify-center mx-auto text-[#2F4F3A]">
            <BarChart2 size={24} />
          </div>
          <h3 className="text-base font-bold text-[#1a2e1e]">No Evaluation Results Published</h3>
          <p className="text-xs text-[#7a6a55] max-w-md mx-auto">
            Official mid-term and semester examination marks will be published here by the examination controller once grading is concluded.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[#1a2e1e]">{r.course_name || r.course}</h4>
                  <p className="text-xs text-[#7a6a55]">{r.course_code}</p>
                </div>
                <span className="font-bold text-[#2F4F3A] text-lg">{r.grade || `${r.percentage}%`}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
