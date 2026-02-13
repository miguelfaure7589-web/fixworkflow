"use client";

import { useState, useCallback } from "react";
import { questions, getVisibleQuestions, type Question } from "@/data/questions";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

interface DiagnosticFormProps {
  onComplete: (answers: Record<string, string | string[] | number>) => void;
  prefilledCategory?: string;
}

export default function DiagnosticForm({ onComplete, prefilledCategory }: DiagnosticFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>(
    prefilledCategory ? { frictionAreas: [prefilledCategory] } : {}
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[currentIndex];
  const progress = ((currentIndex + 1) / visibleQuestions.length) * 100;
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const setAnswer = useCallback(
    (questionId: string, value: string | string[] | number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete(answers);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, visibleQuestions.length - 1));
    }
  }, [isLastQuestion, answers, onComplete, visibleQuestions.length]);

  const handleBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSingleSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswer(questionId, value);
      // Auto-advance after selection for single-select questions
      setTimeout(() => {
        if (!isLastQuestion) {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 300);
    },
    [setAnswer, isLastQuestion]
  );

  const handleMultiSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const current = (prev[questionId] as string[]) || [];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [questionId]: updated };
      });
    },
    []
  );

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>FixWorkflow Diagnosis</span>
            <span>
              Step {currentIndex + 1} of {visibleQuestions.length}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-white mb-2">{currentQuestion.question}</h2>
          {currentQuestion.subtitle && (
            <p className="text-slate-400 mb-6">{currentQuestion.subtitle}</p>
          )}

          {/* Single Select */}
          {currentQuestion.type === "single" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSingleSelect(currentQuestion.id, option.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    currentAnswer === option.value
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-slate-400 mt-1">{option.description}</div>
                      )}
                    </div>
                    {currentAnswer === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Multi Select */}
          {(currentQuestion.type === "multi" || currentQuestion.type === "tools") &&
            currentQuestion.options && (
              <div className={`grid gap-3 ${currentQuestion.type === "tools" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                {currentQuestion.options.map((option) => {
                  const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleMultiSelect(currentQuestion.id, option.value)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                        selected
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selected ? "border-blue-500 bg-blue-500" : "border-slate-500"
                          }`}
                        >
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-slate-400 mt-0.5">{option.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          {/* Scale */}
          {currentQuestion.type === "scale" && currentQuestion.min !== undefined && currentQuestion.max !== undefined && (
            <div className="flex gap-3 justify-center mt-4">
              {Array.from(
                { length: currentQuestion.max - currentQuestion.min + 1 },
                (_, i) => i + currentQuestion.min!
              ).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setAnswer(currentQuestion.id, value);
                    setTimeout(() => {
                      if (!isLastQuestion) setCurrentIndex((prev) => prev + 1);
                    }, 300);
                  }}
                  className={`w-14 h-14 rounded-xl border-2 text-lg font-semibold transition-all duration-200 ${
                    currentAnswer === value
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {(currentQuestion.type === "multi" || currentQuestion.type === "tools" || isLastQuestion) && (
            <button
              onClick={handleNext}
              disabled={
                currentAnswer === undefined ||
                (Array.isArray(currentAnswer) && currentAnswer.length === 0)
              }
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isLastQuestion ? "Get My Results" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
