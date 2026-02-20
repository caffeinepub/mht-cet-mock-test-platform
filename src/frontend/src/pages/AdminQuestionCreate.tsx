import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { useCreateQuestion } from '../hooks/useQuestionMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Loader2, Plus, X } from 'lucide-react';
import { Subject, ClassLevel } from '../backend';
import { useEffect } from 'react';

export default function AdminQuestionCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();
  const { mutate: createQuestion, isPending } = useCreateQuestion();

  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const [options, setOptions] = useState<Array<{ text: string; image: string }>>([
    { text: '', image: '' },
    { text: '', image: '' },
    { text: '', image: '' },
    { text: '', image: '' },
  ]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.physics);
  const [classLevel, setClassLevel] = useState<ClassLevel>(ClassLevel.class11th);

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

  const handleOptionChange = (index: number, field: 'text' | 'image', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!questionText.trim() && !questionImage.trim()) {
      alert('Please provide either question text or question image');
      return;
    }

    const hasValidOptions = options.every(opt => opt.text.trim() || opt.image.trim());
    if (!hasValidOptions) {
      alert('All options must have either text or image');
      return;
    }

    // Prepare options for backend
    const backendOptions = options.map(opt => ({
      optionText: opt.text.trim() || undefined,
      optionImage: opt.image.trim() || undefined,
    }));

    createQuestion({
      questionText: questionText.trim() || null,
      questionImage: questionImage.trim() || null,
      options: backendOptions,
      correctAnswerIndex: BigInt(correctAnswerIndex),
      explanation: explanation.trim() || null,
      subject,
      classLevel,
    });
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
  const isAdmin = userRole === 'admin';
  if (roleFetched && !isAdmin) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have admin permissions to create questions.
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
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Question</h1>
          <p className="text-muted-foreground">
            Add a new question to the question bank
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Provide the question text or image, and select the subject and class level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text (Optional)</Label>
                <Textarea
                  id="questionText"
                  placeholder="Enter the question text..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionImage">Question Image URL (Optional)</Label>
                <Input
                  id="questionImage"
                  type="text"
                  placeholder="https://example.com/question-image.jpg"
                  value={questionImage}
                  onChange={(e) => setQuestionImage(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={subject}
                    onValueChange={(value) => setSubject(value as Subject)}
                  >
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
                  <Select
                    value={classLevel}
                    onValueChange={(value) => setClassLevel(value as ClassLevel)}
                  >
                    <SelectTrigger id="classLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ClassLevel.class11th}>Class 11th</SelectItem>
                      <SelectItem value={ClassLevel.class12th}>Class 12th</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Answer Options</CardTitle>
              <CardDescription>
                Provide 4 options and select the correct answer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Option {index + 1}
                      {correctAnswerIndex === index && (
                        <span className="ml-2 text-sm font-normal text-green-600">
                          (Correct Answer)
                        </span>
                      )}
                    </Label>
                    <Button
                      type="button"
                      variant={correctAnswerIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCorrectAnswerIndex(index)}
                    >
                      {correctAnswerIndex === index ? 'Correct' : 'Mark as Correct'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`option-text-${index}`}>Option Text</Label>
                    <Input
                      id={`option-text-${index}`}
                      type="text"
                      placeholder="Enter option text..."
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`option-image-${index}`}>Option Image URL (Optional)</Label>
                    <Input
                      id={`option-image-${index}`}
                      type="text"
                      placeholder="https://example.com/option-image.jpg"
                      value={option.image}
                      onChange={(e) => handleOptionChange(index, 'image', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Explanation (Optional)</CardTitle>
              <CardDescription>
                Provide an explanation for the correct answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="explanation"
                placeholder="Explain why this is the correct answer..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Question...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Question
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
