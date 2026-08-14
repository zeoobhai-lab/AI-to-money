import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TestQuiz, Question, TestResult } from '../../types';
import { Award, Clock, CheckCircle2, Sparkles, Check, X } from 'lucide-react';

export const TestQuizPage: React.FC = () => {
  const { quizzes, submitTestResult, currentUser } = useApp();

  const [activeTest, setActiveTest] = useState<TestQuiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [testCompletedResult, setTestCompletedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!activeTest) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTest]);

  const handleStartTest = (quiz: TestQuiz) => {
    setActiveTest(quiz);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setTimeLeftSeconds(quiz.totalDurationMinutes * 60);
    setTestCompletedResult(null);
  };

  const handleOptionSelect = (qId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleForceSubmit = () => {
    if (!activeTest || !currentUser) return;

    let score = 0;
    let correctCount = 0;

    activeTest.questions.forEach((q) => {
      const userAns = selectedAnswers[q.id];
      if (userAns !== undefined) {
        if (userAns === q.correctOptionIndex) {
          score += q.marks;
          correctCount++;
        }
      }
    });

    const accuracy = Math.round((correctCount / activeTest.questions.length) * 100);

    const result = submitTestResult({
      testId: activeTest.id,
      userId: currentUser.id,
      userName: currentUser.name,
      score: Math.max(0, score),
      totalMarks: activeTest.totalMarks,
      accuracyPercentage: accuracy,
      timeSpentSeconds: activeTest.totalDurationMinutes * 60 - timeLeftSeconds,
      userAnswers: selectedAnswers
    });

    setTestCompletedResult(result);
    setActiveTest(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {!activeTest && (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/30 relative overflow-hidden space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
            <Award className="w-3.5 h-3.5" />
            <span>AI Skill Certification</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            AI & Web Developer Skill Certification Exam
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
            Test your prompt engineering, WebGL 3D design, and automation knowledge. Pass with 70%+ to unlock your verified AI Engineer certificate.
          </p>
        </div>
      )}

      {/* Catalog */}
      {!activeTest && !testCompletedResult && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Certification Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 hover:border-amber-500/40 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-white text-base">{quiz.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {quiz.questions.length} Questions • Total Marks: {quiz.totalMarks}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {quiz.totalDurationMinutes} Minutes
                  </span>
                  <button
                    onClick={() => handleStartTest(quiz)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors shadow-md"
                  >
                    Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Exam Interface */}
      {activeTest && (
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/40 flex items-center justify-between gap-4 sticky top-20 z-30">
            <div>
              <h3 className="font-bold text-white text-sm">{activeTest.title}</h3>
              <p className="text-[10px] text-amber-400 font-mono">
                Question {currentQIndex + 1} of {activeTest.questions.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gray-900 border border-amber-500/40 px-4 py-1.5 rounded-xl flex items-center gap-2 font-mono text-amber-400 font-bold text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={handleForceSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Submit Exam
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 space-y-6">
              <div className="text-sm font-semibold text-white leading-relaxed">
                <span className="text-amber-400 font-bold mr-2">Q{currentQIndex + 1}.</span>
                {activeTest.questions[currentQIndex]?.questionText}
              </div>

              <div className="space-y-3 pt-2">
                {activeTest.questions[currentQIndex]?.options.map((opt, optIdx) => {
                  const qId = activeTest.questions[currentQIndex].id;
                  const isSelected = selectedAnswers[qId] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(qId, optIdx)}
                      className={`w-full p-4 rounded-2xl text-left text-xs font-medium border flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md'
                          : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-gray-800 text-amber-400 text-[11px] font-mono flex items-center justify-center font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold glass-panel border border-gray-800 text-gray-300 disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(activeTest.questions.length - 1, prev + 1))}
                  disabled={currentQIndex === activeTest.questions.length - 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-30"
                >
                  Next Question
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-gray-800 space-y-4">
              <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-purple-400">
                Question Palette
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((q, idx) => {
                  const answered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'ring-2 ring-amber-400 bg-amber-400 text-black font-extrabold'
                          : answered
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-900 border border-gray-800 text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scorecard */}
      {testCompletedResult && (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/30 text-center space-y-6 max-w-2xl mx-auto shadow-2xl shadow-amber-500/20">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto ring-4 ring-amber-500/30">
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-black text-white">AI Skill Certification Result</h2>

          <div className="grid grid-cols-2 gap-4 bg-gray-900/80 p-4 rounded-2xl border border-gray-800 text-center">
            <div>
              <p className="text-2xl font-black text-amber-400">
                {testCompletedResult.score}/{testCompletedResult.totalMarks}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Total Score</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">
                {testCompletedResult.accuracyPercentage}%
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Accuracy</p>
            </div>
          </div>

          <button
            onClick={() => setTestCompletedResult(null)}
            className="px-6 py-3 rounded-2xl font-bold text-xs text-black bg-amber-400 hover:bg-amber-300 transition-colors"
          >
            Back to Certification List
          </button>
        </div>
      )}

    </div>
  );
};
