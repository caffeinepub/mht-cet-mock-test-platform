import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllQuestions, useGetCallerUserRole } from '../hooks/useQueries';
import { useFullSyllabusTestMutations } from '../hooks/useFullSyllabusTestMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { Subject } from '../backend';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminFullSyllabusTestCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();
  const { data: questions = [], isLoading: questionsLoading } = useGetAllQuestions();
  const { createFullSyllabusTest, assignQuestionsToTest } = useFullSyllabusTestMutations();

  const [testName, setTestName] = useState('');
  const [section1Questions, setSection1Questions] = useState<Set<bigint>>(new Set());
  const [section2Questions, setSection2Questions] = useState<Set<bigint>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  // Redirect non-admin users after role is fetched
  useEffect(() => {
    if (roleFetched && userRole !== 'admin') {
      navigate({ to: '/' });
    }
  }, [roleFetched, userRole, navigate]);

  const physicsChemistryQuestions = questions.filter(
    (q) => q.subject === Subject.physics || q.subject === Subject.chemistry
  );

  const mathsQuestions = questions.filter((q) => q.subject === Subject.maths);

  const toggleSection1Question = (questionId: bigint) => {
    const newSet = new Set(section1Questions);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSection1Questions(newSet);
  };

  const toggleSection2Question = (questionId: bigint) => {
    const newSet = new Set(section2Questions);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSection2Questions(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a test name',
      });
      return;
    }

    if (section1Questions.size === 0 || section2Questions.size === 0) {
      toast.error('Validation Error', {
        description: 'Both sections must have at least one question',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create the test
      const testId = await createFullSyllabusTest.mutateAsync({ testName: testName.trim() });

      // Step 2: Assign questions to the test
      await assignQuestionsToTest.mutateAsync({
        testId,
        section1QuestionIds: Array.from(section1Questions),
        section2QuestionIds: Array.from(section2Questions),
      });

      toast.success('Test Created Successfully', {
        description: `${testName} has been created with ${section1Questions.size + section2Questions.size} questions`,
      });

      // Navigate back to admin dashboard
      navigate({ to: '/admin' });
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast.error('Failed to Create Test', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isInitializing || roleLoading || questionsLoading) {
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

  // Show access denied if not admin
  const isAdmin = userRole === 'admin';
  if (roleFetched && !isAdmin) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have admin permissions to create tests.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate({ to: '/' })} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Full Syllabus Mock Test</h1>
          <p className="text-muted-foreground">
            Create a comprehensive mock test with two sections
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Provide a name for the mock test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  type="text"
                  placeholder="e.g., MHT-CET Mock Test 1"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Section 1: Physics + Chemistry */}
            <Card>
              <CardHeader>
                <CardTitle>Section 1: Physics + Chemistry</CardTitle>
                <CardDescription>
                  Select questions for Section 1 ({section1Questions.size} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {physicsChemistryQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No Physics or Chemistry questions available. Create questions first.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {physicsChemistryQuestions.map((question) => (
                      <div
                        key={question.id.toString()}
                        className="flex items-start space-x-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          id={`section1-${question.id.toString()}`}
                          checked={section1Questions.has(question.id)}
                          onCheckedChange={() => toggleSection1Question(question.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`section1-${question.id.toString()}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            <span className="font-semibold capitalize">{question.subject}</span>
                            {' - '}
                            {question.questionText || 'Image-based question'}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Maths */}
            <Card>
              <CardHeader>
                <CardTitle>Section 2: Maths</CardTitle>
                <CardDescription>
                  Select questions for Section 2 ({section2Questions.size} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mathsQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No Maths questions available. Create questions first.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {mathsQuestions.map((question) => (
                      <div
                        key={question.id.toString()}
                        className="flex items-start space-x-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          id={`section2-${question.id.toString()}`}
                          checked={section2Questions.has(question.id)}
                          onCheckedChange={() => toggleSection2Question(question.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`section2-${question.id.toString()}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {question.questionText || 'Image-based question'}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              type="submit"
              disabled={isCreating || section1Questions.size === 0 || section2Questions.size === 0}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Test...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Test
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/admin' })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
