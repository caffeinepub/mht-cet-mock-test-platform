import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTestAttemptById, useFullSyllabusTestById, useAllQuestions } from '../hooks/useQueries';
import { useTestSectionMutations } from '../hooks/useTestSectionMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Answer } from '../backend';

export default function TestInterface() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { attemptId?: string };
  const { identity, isInitializing } = useInternetIdentity();
  
  const attemptId = search.attemptId ? BigInt(search.attemptId) : null;
  
  const { data: attempt, isLoading: attemptLoading, refetch: refetchAttempt } = useTestAttemptById(attemptId);
  const { data: test } = useFullSyllabusTestById(attempt?.testId || null);
  const { data: allQuestions = [] } = useAllQuestions();
  const { startSection, submitSection } = useTestSectionMutations();

  const [currentAnswers, setCurrentAnswers] = useState<Record<string, number>>({});
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  // Determine current section and redirect if test is complete
  useEffect(() => {
    if (attempt) {
      if (attempt.section1SubmittedAt && attempt.section2SubmittedAt) {
        // Both sections submitted, redirect to results
        navigate({ to: '/result/$resultId', params: { resultId: attempt.attemptId.toString() } });
      } else if (attempt.section1SubmittedAt && !attempt.section2StartTime) {
        // Section 1 submitted but Section 2 not started - show transition
        setShowTransition(true);
      } else {
        setShowTransition(false);
      }
    }
  }, [attempt, navigate]);

  // Timer logic
  useEffect(() => {
    if (!attempt) return;

    const currentSection = attempt.section1SubmittedAt ? 2 : 1;
    const sectionStartTime = currentSection === 1 ? attempt.section1StartTime : attempt.section2StartTime;

    if (!sectionStartTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const startTime = Number(sectionStartTime) / 1000000; // Convert nanoseconds to milliseconds
      const elapsed = now - startTime;
      const timeLimit = 90 * 60 * 1000; // 90 minutes in milliseconds
      const remaining = Math.max(0, timeLimit - elapsed);

      setRemainingTime(remaining);

      // Auto-submit when time reaches zero
      if (remaining === 0 && !attempt.section1SubmittedAt && currentSection === 1) {
        handleSubmitSection(false);
      } else if (remaining === 0 && !attempt.section2SubmittedAt && currentSection === 2) {
        handleSubmitSection(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [attempt]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitSection = async (showConfirmation: boolean = true) => {
    if (showConfirmation) {
      setShowSubmitDialog(true);
      return;
    }

    if (!attempt) return;

    const currentSection = attempt.section1SubmittedAt ? 2 : 1;
    const answers: Answer[] = Object.entries(currentAnswers).map(([questionId, selectedOptionIndex]) => ({
      questionId: BigInt(questionId),
      selectedOptionIndex: BigInt(selectedOptionIndex),
    }));

    try {
      await submitSection.mutateAsync({
        attemptId: attempt.attemptId,
        sectionNumber: BigInt(currentSection),
        answers,
      });

      setCurrentAnswers({});
      await refetchAttempt();

      if (currentSection === 1) {
        setShowTransition(true);
      } else {
        // Section 2 complete, navigate to results
        navigate({ to: '/result/$resultId', params: { resultId: attempt.attemptId.toString() } });
      }
    } catch (error) {
      console.error('Error submitting section:', error);
    }
  };

  const handleStartSection2 = async () => {
    if (!attempt) return;

    try {
      await startSection.mutateAsync({
        attemptId: attempt.attemptId,
        sectionNumber: BigInt(2),
      });

      await refetchAttempt();
      setShowTransition(false);
    } catch (error) {
      console.error('Error starting section 2:', error);
    }
  };

  if (isInitializing || attemptLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!identity || !attempt || !test) {
    return null;
  }

  const currentSection = attempt.section1SubmittedAt ? 2 : 1;
  const sectionData = currentSection === 1 ? test.section1 : test.section2;
  const sectionQuestions = allQuestions.filter(q => sectionData.questionIds.some(id => id === q.id));

  // Transition screen between sections
  if (showTransition) {
    const section1Time = attempt.section1SubmittedAt && attempt.section1StartTime
      ? Number(attempt.section1SubmittedAt - attempt.section1StartTime) / 1000000000
      : 0;
    const section1Minutes = Math.floor(section1Time / 60);
    const section1Seconds = Math.floor(section1Time % 60);

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-green-600" />
              <h2 className="mb-4 text-3xl font-bold">Section 1 Complete!</h2>
              
              <div className="mb-8 space-y-4">
                <div className="rounded-lg border bg-accent/50 p-4">
                  <p className="text-sm text-muted-foreground">Questions Attempted</p>
                  <p className="text-2xl font-bold">{attempt.section1Answers.length} / {test.section1.questionIds.length}</p>
                </div>
                
                <div className="rounded-lg border bg-accent/50 p-4">
                  <p className="text-sm text-muted-foreground">Time Taken</p>
                  <p className="text-2xl font-bold">
                    {section1Minutes}m {section1Seconds}s
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="mb-2 text-xl font-semibold">Ready for Section 2?</h3>
                <p className="mb-1 text-muted-foreground">Mathematics</p>
                <p className="text-sm text-muted-foreground">
                  {test.section2.questionIds.length} questions • {test.section2.durationMinutes.toString()} minutes • {test.section2.marksPerQuestion.toString()} marks each
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleStartSection2}
                disabled={startSection.isPending}
                className="w-full max-w-xs"
              >
                {startSection.isPending ? 'Starting...' : 'Start Section 2'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(currentAnswers).length;
  const totalQuestions = sectionQuestions.length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header with Timer */}
        <div className="sticky top-0 z-10 mb-6 rounded-lg border bg-card p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{test.testName}</h1>
              <p className="text-sm text-muted-foreground">
                Section {currentSection}: {sectionData.name}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">
                  {answeredCount} / {totalQuestions}
                </p>
              </div>
              
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
                <Clock className={`h-5 w-5 ${remainingTime < 300000 ? 'text-destructive' : 'text-primary'}`} />
                <span className={`text-xl font-bold ${remainingTime < 300000 ? 'text-destructive' : 'text-primary'}`}>
                  {formatTime(remainingTime)}
                </span>
              </div>
              
              <Button
                onClick={() => handleSubmitSection(true)}
                disabled={submitSection.isPending}
                size="lg"
              >
                {submitSection.isPending ? 'Submitting...' : `Submit Section ${currentSection}`}
              </Button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {sectionQuestions.map((question, index) => (
            <Card key={question.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">
                    <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
                    {question.questionText || 'Question'}
                  </CardTitle>
                  <Badge variant={currentAnswers[question.id.toString()] !== undefined ? 'default' : 'outline'}>
                    {sectionData.marksPerQuestion.toString()} {sectionData.marksPerQuestion === BigInt(1) ? 'mark' : 'marks'}
                  </Badge>
                </div>
                {question.questionImage && (
                  <img
                    src={question.questionImage}
                    alt="Question"
                    className="mt-4 max-w-full rounded-lg border"
                  />
                )}
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={currentAnswers[question.id.toString()]?.toString()}
                  onValueChange={(value) => handleAnswerChange(question.id.toString(), parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                      >
                        <RadioGroupItem value={optionIndex.toString()} id={`q${question.id}-opt${optionIndex}`} />
                        <Label
                          htmlFor={`q${question.id}-opt${optionIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option.optionText && <span>{option.optionText}</span>}
                          {option.optionImage && (
                            <img
                              src={option.optionImage}
                              alt={`Option ${optionIndex + 1}`}
                              className="mt-2 max-w-full rounded border"
                            />
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Confirmation Dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Section {currentSection}?</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-2">
                  <p>You have answered {answeredCount} out of {totalQuestions} questions.</p>
                  {answeredCount < totalQuestions && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-200">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">
                        You have {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount !== 1 ? 's' : ''}. 
                        Once submitted, you cannot return to this section.
                      </p>
                    </div>
                  )}
                  <p className="font-semibold">Are you sure you want to submit?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowSubmitDialog(false);
                handleSubmitSection(false);
              }}>
                Submit Section
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
