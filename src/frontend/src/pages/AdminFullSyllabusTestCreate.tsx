import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAllQuestions, useGetCallerUserRole } from '../hooks/useQueries';
import { useFullSyllabusTestMutations } from '../hooks/useFullSyllabusTestMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Question, Subject } from '../backend';
import { UserRole__1 } from '../backend';

export default function AdminFullSyllabusTestCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: allQuestions = [], isLoading: questionsLoading } = useAllQuestions();
  const { createFullSyllabusTest, assignQuestionsToTest } = useFullSyllabusTestMutations();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();

  const [testName, setTestName] = useState('');
  const [section1Questions, setSection1Questions] = useState<Set<string>>(new Set());
  const [section2Questions, setSection2Questions] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  // Redirect non-admin users after role is fetched
  useEffect(() => {
    if (roleFetched && userRole !== UserRole__1.admin) {
      navigate({ to: '/' });
    }
  }, [roleFetched, userRole, navigate]);

  const physicsChemQuestions = allQuestions.filter(
    (q) => q.subject === 'physics' || q.subject === 'chemistry'
  );

  const mathsQuestions = allQuestions.filter((q) => q.subject === 'maths');

  const handleSection1Toggle = (questionId: string) => {
    setSection1Questions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSection2Toggle = (questionId: string) => {
    setSection2Questions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    // Validation
    if (!testName.trim()) {
      setValidationError('Test name is required');
      return;
    }

    if (section1Questions.size === 0) {
      setValidationError('Please select at least one question for Section 1 (Physics + Chemistry)');
      return;
    }

    if (section2Questions.size === 0) {
      setValidationError('Please select at least one question for Section 2 (Maths)');
      return;
    }

    try {
      // Create the test
      const testId = await createFullSyllabusTest.mutateAsync({ testName: testName.trim() });

      // Assign questions to both sections
      const section1Ids = Array.from(section1Questions).map(id => BigInt(id));
      const section2Ids = Array.from(section2Questions).map(id => BigInt(id));

      await assignQuestionsToTest.mutateAsync({
        testId,
        section1QuestionIds: section1Ids,
        section2QuestionIds: section2Ids,
      });

      setSuccessMessage(`Full Syllabus Test created successfully! Test ID: ${testId.toString()}`);
      
      // Reset form
      setTestName('');
      setSection1Questions(new Set());
      setSection2Questions(new Set());

      // Navigate back after a short delay
      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2000);
    } catch (error: any) {
      console.error('Error creating full syllabus test:', error);
      setValidationError(error.message || 'Failed to create test. Please try again.');
    }
  };

  const getSubjectLabel = (subject: string) => {
    switch (subject) {
      case 'physics': return 'Physics';
      case 'chemistry': return 'Chemistry';
      case 'maths': return 'Maths';
      default: return subject;
    }
  };

  const getClassLabel = (classLevel: string) => {
    switch (classLevel) {
      case 'class11th': return '11th';
      case 'class12th': return '12th';
      default: return classLevel;
    }
  };

  if (isInitializing || questionsLoading || roleLoading) {
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
  const isAdmin = userRole === UserRole__1.admin;
  if (roleFetched && !isAdmin) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have admin permissions to access this page.
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
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/admin' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Full Syllabus Mock Test</h1>
          <p className="text-muted-foreground">
            Create a comprehensive mock test with two sections: Physics + Chemistry (90 min, 1 mark each) and Maths (90 min, 2 marks each)
          </p>
        </div>

        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-900 dark:text-green-100">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {validationError && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-destructive">{validationError}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Name */}
          <Card>
            <CardHeader>
              <CardTitle>Test Name</CardTitle>
              <CardDescription>Give your mock test a descriptive name</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  placeholder="e.g., MHT-CET Mock Test 2026 - Set 1"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Physics + Chemistry */}
          <Card>
            <CardHeader>
              <CardTitle>Section 1: Physics + Chemistry</CardTitle>
              <CardDescription>
                Select questions for Section 1 (90 minutes, 1 mark per question) - {section1Questions.size} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {physicsChemQuestions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No Physics or Chemistry questions available. Create questions first.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {physicsChemQuestions.map((question) => (
                    <div
                      key={question.id.toString()}
                      className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50"
                    >
                      <Checkbox
                        id={`section1-${question.id.toString()}`}
                        checked={section1Questions.has(question.id.toString())}
                        onCheckedChange={() => handleSection1Toggle(question.id.toString())}
                      />
                      <div className="flex-1 space-y-2">
                        <Label
                          htmlFor={`section1-${question.id.toString()}`}
                          className="cursor-pointer font-normal"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline">
                              {getSubjectLabel(question.subject)}
                            </Badge>
                            <Badge variant="secondary">
                              {getClassLabel(question.classLevel)}
                            </Badge>
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
              )}
            </CardContent>
          </Card>

          {/* Section 2: Maths */}
          <Card>
            <CardHeader>
              <CardTitle>Section 2: Maths</CardTitle>
              <CardDescription>
                Select questions for Section 2 (90 minutes, 2 marks per question) - {section2Questions.size} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mathsQuestions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No Maths questions available. Create questions first.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {mathsQuestions.map((question) => (
                    <div
                      key={question.id.toString()}
                      className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50"
                    >
                      <Checkbox
                        id={`section2-${question.id.toString()}`}
                        checked={section2Questions.has(question.id.toString())}
                        onCheckedChange={() => handleSection2Toggle(question.id.toString())}
                      />
                      <div className="flex-1 space-y-2">
                        <Label
                          htmlFor={`section2-${question.id.toString()}`}
                          className="cursor-pointer font-normal"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline">
                              {getSubjectLabel(question.subject)}
                            </Badge>
                            <Badge variant="secondary">
                              {getClassLabel(question.classLevel)}
                            </Badge>
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
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/admin' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFullSyllabusTest.isPending || assignQuestionsToTest.isPending}
            >
              {createFullSyllabusTest.isPending || assignQuestionsToTest.isPending
                ? 'Creating Test...'
                : 'Create Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
