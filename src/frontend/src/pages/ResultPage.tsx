import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTestAttempt, useFullSyllabusTestById, useAllQuestions, useChapterWiseTestById, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Clock, Trophy, Target, TrendingUp, ArrowLeft, BarChart3, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Question, Answer } from '../backend';
import { generateResultPDF } from '../utils/pdfExport';
import { toast } from 'sonner';

export default function ResultPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { resultId?: string };
  const { identity, isInitializing } = useInternetIdentity();
  
  const attemptId = params.resultId ? BigInt(params.resultId) : null;
  
  const { data: attempt, isLoading: attemptLoading } = useTestAttempt(attemptId);
  const { data: fullSyllabusTest } = useFullSyllabusTestById(attempt?.testId || null);
  const { data: chapterWiseTestResult } = useChapterWiseTestById(attempt?.testId || BigInt(0));
  const { data: allQuestions = [] } = useAllQuestions();
  const { data: userProfile } = useGetCallerUserProfile();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleDownloadPDF = () => {
    if (!attempt || !userProfile) {
      toast.error('Unable to generate PDF: Missing data');
      return;
    }

    const isChapterWise = chapterWiseTestResult !== null;
    const test = isChapterWise && chapterWiseTestResult
      ? chapterWiseTestResult
      : fullSyllabusTest;

    if (!test) {
      toast.error('Unable to generate PDF: Test data not found');
      return;
    }

    setIsGeneratingPDF(true);

    const questions = isChapterWise && chapterWiseTestResult
      ? chapterWiseTestResult.questions
      : allQuestions.filter(q => {
          if (!fullSyllabusTest) return false;
          return fullSyllabusTest.section1.questionIds.some(id => id === q.id) ||
                 fullSyllabusTest.section2.questionIds.some(id => id === q.id);
        });

    const result = generateResultPDF({
      attempt,
      test,
      profile: userProfile,
      questions,
      isChapterWise,
    });

    setIsGeneratingPDF(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to generate PDF');
    } else {
      toast.success('PDF opened in new window. Use your browser\'s print dialog to save or print.');
    }
  };

  if (isInitializing || attemptLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!identity || !attempt) {
    return null;
  }

  // Determine if this is a chapter-wise test
  const isChapterWise = chapterWiseTestResult !== null;
  const test = isChapterWise && chapterWiseTestResult
    ? chapterWiseTestResult
    : fullSyllabusTest;

  if (!test) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Test not found</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalScore = Number(attempt.totalScore);
  let maxTotalScore: number;
  let questions: Question[];

  if (isChapterWise && chapterWiseTestResult) {
    const chapterTest = chapterWiseTestResult;
    questions = chapterTest.questions;
    maxTotalScore = questions.length * Number(chapterTest.marksPerQuestion);
  } else if (fullSyllabusTest) {
    questions = allQuestions.filter(q => 
      fullSyllabusTest.section1.questionIds.some(id => id === q.id) ||
      fullSyllabusTest.section2.questionIds.some(id => id === q.id)
    );
    maxTotalScore = fullSyllabusTest.section1.questionIds.length * Number(fullSyllabusTest.section1.marksPerQuestion) +
                    fullSyllabusTest.section2.questionIds.length * Number(fullSyllabusTest.section2.marksPerQuestion);
  } else {
    return null;
  }

  const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  // Calculate time taken
  const totalTimeSeconds = Number(attempt.totalTimeTaken) / 1000000000;
  const hours = Math.floor(totalTimeSeconds / 3600);
  const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
  const seconds = Math.floor(totalTimeSeconds % 60);

  // Calculate question statistics
  const totalQuestions = questions.length;
  let attempted = 0;
  let correct = 0;

  const allAnswers = isChapterWise 
    ? attempt.singleSectionAnswers 
    : [...attempt.section1Answers, ...attempt.section2Answers];

  allAnswers.forEach(answer => {
    if (Number(answer.selectedOptionIndex) >= 0) {
      attempted++;
    }
    const question = questions.find(q => q.id === answer.questionId);
    if (question && question.correctAnswerIndex === answer.selectedOptionIndex) {
      correct++;
    }
  });

  const incorrect = attempted - correct;
  const unanswered = totalQuestions - attempted;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  // Performance indicator
  let performanceColor = 'text-red-600';
  let performanceText = 'Needs Improvement';
  if (percentage >= 80) {
    performanceColor = 'text-green-600';
    performanceText = 'Excellent';
  } else if (percentage >= 60) {
    performanceColor = 'text-blue-600';
    performanceText = 'Good';
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Test Results</h1>
            <p className="text-muted-foreground">{test.testName}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Score Card */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <Trophy className="mx-auto mb-2 h-12 w-12 text-primary" />
                <p className="mb-1 text-sm text-muted-foreground">Overall Score</p>
                <p className="text-4xl font-bold">
                  {totalScore} / {maxTotalScore}
                </p>
              </div>
              <div className="text-center">
                <Target className="mx-auto mb-2 h-12 w-12 text-primary" />
                <p className="mb-1 text-sm text-muted-foreground">Percentage</p>
                <p className="text-4xl font-bold">{percentage.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <Clock className="mx-auto mb-2 h-12 w-12 text-primary" />
                <p className="mb-1 text-sm text-muted-foreground">Time Taken</p>
                <p className="text-4xl font-bold">
                  {hours > 0 && `${hours}h `}
                  {minutes}m {seconds}s
                </p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="text-center">
              <p className="mb-2 text-sm text-muted-foreground">Performance</p>
              <p className={`text-2xl font-bold ${performanceColor}`}>{performanceText}</p>
            </div>
          </CardContent>
        </Card>

        {/* Section-wise Scores (Full Syllabus Only) */}
        {!isChapterWise && fullSyllabusTest && (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Section 1: Physics + Chemistry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold">
                      {Number(attempt.section1Score)} / {fullSyllabusTest.section1.questionIds.length * Number(fullSyllabusTest.section1.marksPerQuestion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-semibold">{fullSyllabusTest.section1.questionIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marks per Question</span>
                    <span className="font-semibold">{fullSyllabusTest.section1.marksPerQuestion.toString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Section 2: Mathematics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold">
                      {Number(attempt.section2Score)} / {fullSyllabusTest.section2.questionIds.length * Number(fullSyllabusTest.section2.marksPerQuestion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-semibold">{fullSyllabusTest.section2.questionIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marks per Question</span>
                    <span className="font-semibold">{fullSyllabusTest.section2.marksPerQuestion.toString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border bg-accent/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
              </div>
              <div className="rounded-lg border bg-accent/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Attempted</p>
                <p className="text-2xl font-bold">{attempted}</p>
              </div>
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</p>
              </div>
              <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrect}</p>
              </div>
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">Unanswered</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{unanswered}</p>
              </div>
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = allAnswers.find(a => a.questionId === question.id);
              const selectedIndex = userAnswer ? Number(userAnswer.selectedOptionIndex) : -1;
              const correctIndex = Number(question.correctAnswerIndex);
              const isCorrect = selectedIndex === correctIndex;
              
              let marksPerQuestion: number;
              if (isChapterWise && chapterWiseTestResult) {
                marksPerQuestion = Number(chapterWiseTestResult.marksPerQuestion);
              } else if (fullSyllabusTest) {
                const isSection1 = fullSyllabusTest.section1.questionIds.some(id => id === question.id);
                marksPerQuestion = isSection1 
                  ? Number(fullSyllabusTest.section1.marksPerQuestion) 
                  : Number(fullSyllabusTest.section2.marksPerQuestion);
              } else {
                marksPerQuestion = 0;
              }
              const marksAwarded = isCorrect ? marksPerQuestion : 0;

              return (
                <div key={question.id.toString()} className="rounded-lg border p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg font-semibold">Question {index + 1}</span>
                        {selectedIndex >= 0 ? (
                          isCorrect ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Incorrect
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Not Answered
                          </Badge>
                        )}
                      </div>
                      {question.questionText && (
                        <p className="text-muted-foreground">{question.questionText}</p>
                      )}
                      {question.questionImage && (
                        <img
                          src={question.questionImage}
                          alt="Question"
                          className="mt-2 max-w-full rounded-lg border"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Marks</p>
                      <p className="text-xl font-bold">
                        {marksAwarded} / {marksPerQuestion}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedIndex === optionIndex;
                      const isCorrectOption = correctIndex === optionIndex;
                      
                      let optionClass = 'rounded-lg border p-3';
                      if (isCorrectOption) {
                        optionClass += ' border-green-500 bg-green-50 dark:bg-green-950/20';
                      } else if (isSelected && !isCorrect) {
                        optionClass += ' border-red-500 bg-red-50 dark:bg-red-950/20';
                      }

                      return (
                        <div key={optionIndex} className={optionClass}>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <div className="flex-1">
                              {option.optionText && <span>{option.optionText}</span>}
                              {option.optionImage && (
                                <img
                                  src={option.optionImage}
                                  alt={`Option ${optionIndex + 1}`}
                                  className="mt-2 max-w-full rounded border"
                                />
                              )}
                            </div>
                            {isCorrectOption && (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <>
                      <Separator className="my-4" />
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                        <p className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                          Explanation:
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {question.explanation}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
