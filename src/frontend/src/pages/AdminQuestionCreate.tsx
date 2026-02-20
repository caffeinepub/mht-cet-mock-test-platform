import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { useCreateQuestion } from '../hooks/useQuestionMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Subject, ClassLevel, UserRole__1 } from '../backend';

export default function AdminQuestionCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const createQuestion = useCreateQuestion();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();

  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [optionImages, setOptionImages] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.physics);
  const [classLevel, setClassLevel] = useState<ClassLevel>(ClassLevel.class11th);
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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleOptionImageChange = (index: number, value: string) => {
    const newOptionImages = [...optionImages];
    newOptionImages[index] = value;
    setOptionImages(newOptionImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    // Validation
    if (!questionText.trim() && !questionImage.trim()) {
      setValidationError('Question must have either text or an image');
      return;
    }

    const hasAllOptions = options.every((opt, idx) => opt.trim() || optionImages[idx].trim());
    if (!hasAllOptions) {
      setValidationError('All four options must have either text or an image');
      return;
    }

    try {
      const formattedOptions = options.map((opt, idx) => ({
        optionText: opt.trim() || undefined,
        optionImage: optionImages[idx].trim() || undefined,
      }));

      const questionId = await createQuestion.mutateAsync({
        questionText: questionText.trim() || null,
        questionImage: questionImage.trim() || null,
        options: formattedOptions,
        correctAnswerIndex: BigInt(correctAnswer),
        explanation: explanation.trim() || null,
        subject,
        classLevel,
      });

      setSuccessMessage(`Question created successfully! Question ID: ${questionId.toString()}`);
      
      // Reset form
      setQuestionText('');
      setQuestionImage('');
      setOptions(['', '', '', '']);
      setOptionImages(['', '', '', '']);
      setCorrectAnswer('0');
      setExplanation('');
      setSubject(Subject.physics);
      setClassLevel(ClassLevel.class11th);

      // Navigate back after a short delay
      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2000);
    } catch (error: any) {
      console.error('Error creating question:', error);
      setValidationError(error.message || 'Failed to create question. Please try again.');
    }
  };

  if (isInitializing || roleLoading) {
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
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/admin' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Question</h1>
          <p className="text-muted-foreground">
            Add a new question to the question bank for MHT-CET mock tests
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
          {/* Question Content */}
          <Card>
            <CardHeader>
              <CardTitle>Question Content</CardTitle>
              <CardDescription>Enter the question text or provide an image URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text</Label>
                <Textarea
                  id="questionText"
                  placeholder="Enter the question text (optional if image is provided)"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionImage">Question Image URL</Label>
                <Input
                  id="questionImage"
                  placeholder="https://example.com/question-image.png (optional)"
                  value={questionImage}
                  onChange={(e) => setQuestionImage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Answer Options</CardTitle>
              <CardDescription>Provide four options with text or image URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                  <Label>Option {index + 1}</Label>
                  <Input
                    placeholder={`Option ${index + 1} text`}
                    value={options[index]}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  <Input
                    placeholder={`Option ${index + 1} image URL (optional)`}
                    value={optionImages[index]}
                    onChange={(e) => handleOptionImageChange(index, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Correct Answer */}
          <Card>
            <CardHeader>
              <CardTitle>Correct Answer</CardTitle>
              <CardDescription>Select the correct option</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="option-0" />
                  <Label htmlFor="option-0">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="option-1" />
                  <Label htmlFor="option-1">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="option-2" />
                  <Label htmlFor="option-2">Option 3</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="option-3" />
                  <Label htmlFor="option-3">Option 4</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
              <CardDescription>Provide an explanation for the correct answer (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Explain why this is the correct answer..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Question Metadata</CardTitle>
              <CardDescription>Categorize the question by subject and class level</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={(value) => setSubject(value as Subject)}>
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Subject.physics}>Physics</SelectItem>
                    <SelectItem value={Subject.chemistry}>Chemistry</SelectItem>
                    <SelectItem value={Subject.maths}>Maths</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Select value={classLevel} onValueChange={(value) => setClassLevel(value as ClassLevel)}>
                  <SelectTrigger id="classLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClassLevel.class11th}>11th Standard</SelectItem>
                    <SelectItem value={ClassLevel.class12th}>12th Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Button type="submit" disabled={createQuestion.isPending}>
              {createQuestion.isPending ? 'Creating Question...' : 'Create Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
