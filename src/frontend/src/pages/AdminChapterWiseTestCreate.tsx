import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAllQuestions } from '../hooks/useQueries';
import { useCreateChapterWiseTest, useAssignQuestionsToChapterWiseTest } from '../hooks/useChapterWiseTestMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Question } from '../backend';

export default function AdminChapterWiseTestCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: allQuestions = [], isLoading: questionsLoading } = useAllQuestions();
  const createTest = useCreateChapterWiseTest();
  const assignQuestions = useAssignQuestionsToChapterWiseTest();

  const [testName, setTestName] = useState('');
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => {
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

    if (marksPerQuestion < 1 || marksPerQuestion > 10) {
      setValidationError('Marks per question must be between 1 and 10');
      return;
    }

    if (durationMinutes < 10 || durationMinutes > 180) {
      setValidationError('Duration must be between 10 and 180 minutes');
      return;
    }

    if (selectedQuestions.size === 0) {
      setValidationError('Please select at least one question');
      return;
    }

    try {
      // Create the test
      const testId = await createTest.mutateAsync({
        testName: testName.trim(),
        marksPerQuestion,
        durationMinutes,
      });

      // Assign questions to the test
      const questionIds = Array.from(selectedQuestions).map(id => BigInt(id));
      await assignQuestions.mutateAsync({
        testId,
        questionIds,
      });

      setSuccessMessage(`Chapter-Wise Test created successfully! Test ID: ${testId.toString()}`);
      
      // Reset form
      setTestName('');
      setMarksPerQuestion(1);
      setDurationMinutes(30);
      setSelectedQuestions(new Set());

      // Navigate back after a short delay
      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2000);
    } catch (error: any) {
      console.error('Error creating chapter-wise test:', error);
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/admin' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Chapter-Wise Test</h1>
          <p className="text-muted-foreground">
            Configure a custom test with specific chapters, duration, and marking scheme
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
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Set the basic parameters for your test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  placeholder="e.g., 11th Physics - Kinematics"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marksPerQuestion">Marks per Question *</Label>
                  <Input
                    id="marksPerQuestion"
                    type="number"
                    min="1"
                    max="10"
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(parseInt(e.target.value) || 1)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Between 1 and 10 marks</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="10"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Between 10 and 180 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Questions</CardTitle>
              <CardDescription>
                Choose questions from any subject or class level ({selectedQuestions.size} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allQuestions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No questions available. Please create questions first.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate({ to: '/admin/questions/create' })}
                  >
                    Create Questions
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {allQuestions.map((question) => (
                    <div
                      key={question.id.toString()}
                      className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestions.has(question.id.toString())}
                        onCheckedChange={() => handleQuestionToggle(question.id.toString())}
                      />
                      <Label
                        htmlFor={`question-${question.id}`}
                        className="flex-1 cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">
                            {question.questionText || 'Question (with image)'}
                          </p>
                          <div className="flex gap-2 shrink-0">
                            <Badge variant="outline">
                              {getSubjectLabel(question.subject)}
                            </Badge>
                            <Badge variant="secondary">
                              Class {getClassLabel(question.classLevel)}
                            </Badge>
                          </div>
                        </div>
                        {question.questionImage && (
                          <img
                            src={question.questionImage}
                            alt="Question preview"
                            className="max-w-xs rounded border"
                          />
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
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
              disabled={createTest.isPending || assignQuestions.isPending || allQuestions.length === 0}
            >
              {createTest.isPending || assignQuestions.isPending
                ? 'Creating Test...'
                : 'Create Chapter-Wise Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
