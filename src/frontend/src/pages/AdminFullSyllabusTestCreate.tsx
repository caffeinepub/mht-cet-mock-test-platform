import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAllQuestions } from '../hooks/useQueries';
import { useFullSyllabusTestMutations } from '../hooks/useFullSyllabusTestMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Subject } from '../backend';

export default function AdminFullSyllabusTestCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: questions = [], isLoading: questionsLoading } = useAllQuestions();
  const { createFullSyllabusTest, assignQuestionsToTest } = useFullSyllabusTestMutations();

  const [testName, setTestName] = useState('');
  const [section1Selected, setSection1Selected] = useState<Set<bigint>>(new Set());
  const [section2Selected, setSection2Selected] = useState<Set<bigint>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing || questionsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  const section1Questions = questions.filter(
    q => q.subject === Subject.physics || q.subject === Subject.chemistry
  );
  const section2Questions = questions.filter(q => q.subject === Subject.maths);

  const toggleSection1Question = (questionId: bigint) => {
    const newSet = new Set(section1Selected);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSection1Selected(newSet);
  };

  const toggleSection2Question = (questionId: bigint) => {
    const newSet = new Set(section2Selected);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSection2Selected(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!testName.trim()) {
      setError('Test name is required');
      return;
    }

    if (section1Selected.size === 0 && section2Selected.size === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      const testId = await createFullSyllabusTest.mutateAsync({ testName: testName.trim() });
      
      await assignQuestionsToTest.mutateAsync({
        testId,
        section1QuestionIds: Array.from(section1Selected),
        section2QuestionIds: Array.from(section2Selected),
      });

      setSuccess(`Test created successfully! Test ID: ${testId.toString()}`);
      setTestName('');
      setSection1Selected(new Set());
      setSection2Selected(new Set());

      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create test');
    }
  };

  const isSubmitting = createFullSyllabusTest.isPending || assignQuestionsToTest.isPending;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/admin' })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="mb-2 text-3xl font-bold">Create Full Syllabus Test</h1>
          <p className="text-muted-foreground">
            Configure a new Full Syllabus Mock Test with two sections
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Enter the basic information for the test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  placeholder="e.g., Full Syllabus Mock Test 1"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section 1: Physics + Chemistry</CardTitle>
              <CardDescription>
                Duration: 90 minutes | Marks: 1 mark per question | Selected: {section1Selected.size}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {section1Questions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No Physics or Chemistry questions available. Create questions first.
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {section1Questions.map((question) => (
                      <div
                        key={question.id.toString()}
                        className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50"
                      >
                        <Checkbox
                          id={`section1-${question.id.toString()}`}
                          checked={section1Selected.has(question.id)}
                          onCheckedChange={() => toggleSection1Question(question.id)}
                          disabled={isSubmitting}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`section1-${question.id.toString()}`}
                            className="cursor-pointer font-normal"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {question.subject === Subject.physics ? 'Physics' : 'Chemistry'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {question.id.toString()}
                              </span>
                            </div>
                            {question.questionText && (
                              <p className="text-sm">{question.questionText}</p>
                            )}
                            {question.questionImage && (
                              <img
                                src={question.questionImage}
                                alt="Question"
                                className="mt-2 max-h-32 rounded border"
                              />
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section 2: Maths</CardTitle>
              <CardDescription>
                Duration: 90 minutes | Marks: 2 marks per question | Selected: {section2Selected.size}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {section2Questions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No Maths questions available. Create questions first.
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {section2Questions.map((question) => (
                      <div
                        key={question.id.toString()}
                        className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50"
                      >
                        <Checkbox
                          id={`section2-${question.id.toString()}`}
                          checked={section2Selected.has(question.id)}
                          onCheckedChange={() => toggleSection2Question(question.id)}
                          disabled={isSubmitting}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`section2-${question.id.toString()}`}
                            className="cursor-pointer font-normal"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Maths
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {question.id.toString()}
                              </span>
                            </div>
                            {question.questionText && (
                              <p className="text-sm">{question.questionText}</p>
                            )}
                            {question.questionImage && (
                              <img
                                src={question.questionImage}
                                alt="Question"
                                className="mt-2 max-h-32 rounded border"
                              />
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/admin' })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Test...' : 'Create Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
