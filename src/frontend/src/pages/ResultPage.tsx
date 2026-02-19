import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTestAttemptById, useFullSyllabusTestById, useAllQuestions, useChapterWiseTestById, useGetCallerUserProfile } from '../hooks/useQueries';
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
  const { resultId } = useParams({ strict: false });
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const attemptId = resultId ? BigInt(resultId) : null;
  const { data: attempt, isLoading: attemptLoading, error: attemptError } = useTestAttemptById(attemptId);
  const { data: fullSyllabusTest, isLoading: fullSyllabusTestLoading } = useFullSyllabusTestById(attempt?.testId || null);
  const { data: chapterWiseTest, isLoading: chapterWiseTestLoading } = useChapterWiseTestById(attempt?.testId || BigInt(0));
  const { data: allQuestions = [] } = useAllQuestions();
  const { data: userProfile } = useGetCallerUserProfile();

  // Determine which test type we have
  const test = fullSyllabusTest || chapterWiseTest;
  const isChapterWise = !!chapterWiseTest && !fullSyllabusTest;
  const testLoading = fullSyllabusTestLoading || chapterWiseTestLoading;

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleExportPDF = async () => {
    if (!attempt || !test || !userProfile) {
      toast.error('Unable to generate PDF. Missing required data.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Get questions for this test
      let testQuestions: Question[];
      if (isChapterWise && chapterWiseTest) {
        testQuestions = chapterWiseTest.questions;
      } else if (fullSyllabusTest) {
        testQuestions = allQuestions.filter(q => 
          fullSyllabusTest.section1.questionIds.some(id => id === q.id) ||
          fullSyllabusTest.section2.questionIds.some(id => id === q.id)
        );
      } else {
        throw new Error('Unable to determine test questions');
      }

      const result = generateResultPDF({
        attempt,
        test,
        profile: userProfile,
        questions: testQuestions,
        isChapterWise,
      });

      if (result.success) {
        toast.success('PDF print dialog opened. Use "Save as PDF" in the print dialog.');
      } else {
        toast.error(`Failed to generate PDF: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isInitializing || attemptLoading || testLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  if (attemptError || !attempt) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="flex min-h-[60vh] items-center justify-center py-12">
              <div className="text-center">
                <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
                <h2 className="mb-4 text-2xl font-bold">Test Attempt Not Found</h2>
                <p className="mb-6 text-muted-foreground">
                  The test attempt you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Button onClick={() => navigate({ to: '/dashboard' })}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="flex min-h-[60vh] items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Test details not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate scores and statistics
  let totalScore: number;
  let maxTotalScore: number;
  let section1Questions: Question[] = [];
  let section2Questions: Question[] = [];

  if (isChapterWise && chapterWiseTest) {
    totalScore = Number(attempt.singleSectionScore);
    maxTotalScore = chapterWiseTest.questions.length * Number(chapterWiseTest.marksPerQuestion);
  } else if (fullSyllabusTest) {
    totalScore = Number(attempt.section1Score + attempt.section2Score);
    const maxSection1Score = fullSyllabusTest.section1.questionIds.length * Number(fullSyllabusTest.section1.marksPerQuestion);
    const maxSection2Score = fullSyllabusTest.section2.questionIds.length * Number(fullSyllabusTest.section2.marksPerQuestion);
    maxTotalScore = maxSection1Score + maxSection2Score;

    // Get questions for both sections
    section1Questions = allQuestions.filter(q => 
      fullSyllabusTest.section1.questionIds.some(id => id === q.id)
    );
    section2Questions = allQuestions.filter(q => 
      fullSyllabusTest.section2.questionIds.some(id => id === q.id)
    );
  } else {
    totalScore = 0;
    maxTotalScore = 0;
  }

  const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  // Calculate total time
  const totalTimeSeconds = Number(attempt.totalTimeTaken) / 1000000000;
  const totalHours = Math.floor(totalTimeSeconds / 3600);
  const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);
  const totalSeconds = Math.floor(totalTimeSeconds % 60);

  // Performance indicator
  let performanceLabel = 'Needs Improvement';
  let performanceColor = 'text-amber-600';
  if (percentage >= 80) {
    performanceLabel = 'Excellent';
    performanceColor = 'text-green-600';
  } else if (percentage >= 60) {
    performanceLabel = 'Good';
    performanceColor = 'text-blue-600';
  }

  // Calculate section statistics
  const calculateSectionStats = (questions: Question[], answers: Answer[], marksPerQuestion: bigint) => {
    const total = questions.length;
    const attempted = answers.length;
    let correct = 0;

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswerIndex === answer.selectedOptionIndex) {
        correct++;
      }
    });

    const incorrect = attempted - correct;
    const unanswered = total - attempted;

    return { total, attempted, correct, incorrect, unanswered };
  };

  // Prepare all questions with answers for review
  let allQuestionsWithAnswers: Array<{
    question: Question;
    userAnswer?: Answer;
    sectionNumber: number;
    marksPerQuestion: bigint;
  }> = [];

  if (isChapterWise && chapterWiseTest) {
    allQuestionsWithAnswers = chapterWiseTest.questions.map(q => ({
      question: q,
      userAnswer: attempt.singleSectionAnswers.find(a => a.questionId === q.id),
      sectionNumber: 1,
      marksPerQuestion: chapterWiseTest.marksPerQuestion,
    }));
  } else if (fullSyllabusTest) {
    allQuestionsWithAnswers = [
      ...section1Questions.map(q => ({
        question: q,
        userAnswer: attempt.section1Answers.find(a => a.questionId === q.id),
        sectionNumber: 1,
        marksPerQuestion: fullSyllabusTest.section1.marksPerQuestion,
      })),
      ...section2Questions.map(q => ({
        question: q,
        userAnswer: attempt.section2Answers.find(a => a.questionId === q.id),
        sectionNumber: 2,
        marksPerQuestion: fullSyllabusTest.section2.marksPerQuestion,
      })),
    ];
  }

  const section1Stats = !isChapterWise && fullSyllabusTest 
    ? calculateSectionStats(section1Questions, attempt.section1Answers, fullSyllabusTest.section1.marksPerQuestion)
    : null;
  const section2Stats = !isChapterWise && fullSyllabusTest
    ? calculateSectionStats(section2Questions, attempt.section2Answers, fullSyllabusTest.section2.marksPerQuestion)
    : null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/dashboard' })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            variant="default"
            onClick={() => navigate({ to: '/leaderboard/$testId', params: { testId: attempt.testId.toString() } })}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Leaderboard
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            disabled={isGeneratingPDF || !userProfile}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Export PDF'}
          </Button>
        </div>

        {/* Score Summary Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">Test Results</CardTitle>
                <p className="text-muted-foreground mt-1">{test.testName}</p>
              </div>
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Total Score</div>
                <div className="text-4xl font-bold text-primary">
                  {totalScore} / {maxTotalScore}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {percentage.toFixed(1)}%
                </div>
              </div>

              {!isChapterWise && fullSyllabusTest && (
                <>
                  <div className="text-center">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Section 1</div>
                    <div className="text-3xl font-bold">
                      {Number(attempt.section1Score)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {fullSyllabusTest.section1.name}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Section 2</div>
                    <div className="text-3xl font-bold">
                      {Number(attempt.section2Score)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {fullSyllabusTest.section2.name}
                    </div>
                  </div>
                </>
              )}

              {isChapterWise && (
                <div className="text-center">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Score</div>
                  <div className="text-3xl font-bold">
                    {Number(attempt.singleSectionScore)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Chapter-wise Test
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Total Time</div>
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Clock className="h-5 w-5" />
                  {totalHours > 0 && `${totalHours}h `}
                  {totalMinutes}m {totalSeconds}s
                </div>
                <div className={`mt-2 text-sm font-semibold ${performanceColor}`}>
                  {performanceLabel}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Statistics */}
        {!isChapterWise && fullSyllabusTest && section1Stats && section2Stats && (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Section 1 Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Section 1 Statistics
                </CardTitle>
                <p className="text-sm text-muted-foreground">{fullSyllabusTest.section1.name}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="font-semibold">{section1Stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attempted:</span>
                    <span className="font-semibold">{section1Stats.attempted}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Correct:</span>
                    <span className="font-semibold">{section1Stats.correct}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Incorrect:</span>
                    <span className="font-semibold">{section1Stats.incorrect}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Unanswered:</span>
                    <span className="font-semibold">{section1Stats.unanswered}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Section 2 Statistics
                </CardTitle>
                <p className="text-sm text-muted-foreground">{fullSyllabusTest.section2.name}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="font-semibold">{section2Stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attempted:</span>
                    <span className="font-semibold">{section2Stats.attempted}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Correct:</span>
                    <span className="font-semibold">{section2Stats.correct}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Incorrect:</span>
                    <span className="font-semibold">{section2Stats.incorrect}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Unanswered:</span>
                    <span className="font-semibold">{section2Stats.unanswered}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Review Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Detailed Question Review
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review all questions with correct answers and explanations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {allQuestionsWithAnswers.map((item, index) => {
                const { question, userAnswer, sectionNumber, marksPerQuestion } = item;
                const isCorrect = userAnswer && question.correctAnswerIndex === userAnswer.selectedOptionIndex;
                const isAnswered = !!userAnswer;

                return (
                  <div key={question.id.toString()} className="rounded-lg border p-6">
                    {/* Question Header */}
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {!isChapterWise && (
                            <Badge variant="outline">
                              Section {sectionNumber}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {Number(marksPerQuestion)} {Number(marksPerQuestion) === 1 ? 'mark' : 'marks'}
                          </Badge>
                          {isAnswered ? (
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
                            <Badge variant="outline" className="border-amber-600 text-amber-600">
                              Not Answered
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">
                          <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
                          {question.questionText || 'Question'}
                        </h3>
                      </div>
                    </div>

                    {/* Question Image */}
                    {question.questionImage && (
                      <img
                        src={question.questionImage}
                        alt="Question"
                        className="mb-4 max-w-full rounded-lg border"
                      />
                    )}

                    {/* Options */}
                    <div className="mb-4 space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer && Number(userAnswer.selectedOptionIndex) === optionIndex;
                        const isCorrectAnswer = Number(question.correctAnswerIndex) === optionIndex;

                        let borderColor = 'border-border';
                        let bgColor = 'bg-background';

                        if (isCorrectAnswer) {
                          borderColor = 'border-green-600';
                          bgColor = 'bg-green-50 dark:bg-green-950/20';
                        } else if (isUserAnswer && !isCorrect) {
                          borderColor = 'border-red-600';
                          bgColor = 'bg-red-50 dark:bg-red-950/20';
                        }

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-start gap-3 rounded-lg border-2 p-4 ${borderColor} ${bgColor}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                                isCorrectAnswer
                                  ? 'border-green-600 bg-green-600 text-white'
                                  : isUserAnswer
                                  ? 'border-red-600 bg-red-600 text-white'
                                  : 'border-muted-foreground'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              {isCorrectAnswer && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              {option.optionText && (
                                <span className="block">{option.optionText}</span>
                              )}
                              {option.optionImage && (
                                <img
                                  src={option.optionImage}
                                  alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                  className="mt-2 max-w-full rounded border"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="mb-2 font-semibold text-sm">Explanation:</h4>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
