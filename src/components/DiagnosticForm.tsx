"use client";

import { useState, useCallback } from "react";
import { questions, getVisibleQuestions } from "@/data/questions";
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
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>FixWorkFlow Diagnosis</span>
            <span>
              Step {currentIndex + 1} of {visibleQuestions.length}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{currentQuestion.question}</h2>
          {currentQuestion.subtitle && (
            <p className="text-gray-400 mb-6">{currentQuestion.subtitle}</p>
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
                      ? "border-blue-500 bg-blue-50 text-gray-900"
                      : "border-gray-150 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-400 mt-1">{option.description}</div>
                      )}
                    </div>
                    {currentAnswer === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
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
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-150 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
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
                            <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          {/* Text Input */}
          {currentQuestion.type === "text" && (
            <div className="mt-2">
              <textarea
                value={(currentAnswer as string) || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!currentQuestion.maxLength || val.length <= currentQuestion.maxLength) {
                    setAnswer(currentQuestion.id, val);
                  }
                }}
                placeholder="e.g. I want to streamline client onboarding, reduce time spent on manual invoicing, and find a better way to manage my remote team..."
                className="w-full h-36 p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                maxLength={currentQuestion.maxLength}
              />
              {currentQuestion.maxLength && (
                <div className="flex justify-end mt-2">
                  <span className={`text-sm ${
                    ((currentAnswer as string) || "").length > (currentQuestion.maxLength * 0.9)
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}>
                    {((currentAnswer as string) || "").length}/{currentQuestion.maxLength}
                  </span>
                </div>
              )}
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
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
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
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Skip button for optional questions (drill-downs and text) */}
            {(currentQuestion.dependsOn || currentQuestion.type === "text") && !isLastQuestion && (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
              >
                Skip
              </button>
            )}

            {(currentQuestion.type === "multi" || currentQuestion.type === "tools" || currentQuestion.type === "text" || isLastQuestion) && (
              <button
                onClick={handleNext}
                disabled={
                  currentQuestion.type !== "text" && !currentQuestion.dependsOn && (
                    currentAnswer === undefined ||
                    currentAnswer === "" ||
                    (Array.isArray(currentAnswer) && currentAnswer.length === 0)
                  )
                }
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                {isLastQuestion ? "Get My Results" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
