import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateQuestion } from '../hooks/useQuestionMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Subject, ClassLevel } from '../backend';

interface OptionData {
  text: string;
  image: string | null;
  imagePreview: string | null;
}

export default function AdminQuestionCreate() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const createQuestionMutation = useCreateQuestion();

  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  
  const [options, setOptions] = useState<OptionData[]>([
    { text: '', image: null, imagePreview: null },
    { text: '', image: null, imagePreview: null },
    { text: '', image: null, imagePreview: null },
    { text: '', image: null, imagePreview: null },
  ]);
  
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<string>('0');
  const [explanation, setExplanation] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.physics);
  const [classLevel, setClassLevel] = useState<ClassLevel>(ClassLevel.class11th);
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setQuestionImage(base64);
        setQuestionImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newOptions = [...options];
        newOptions[index] = {
          ...newOptions[index],
          image: base64,
          imagePreview: base64,
        };
        setOptions(newOptions);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    setOptions(newOptions);
  };

  const removeQuestionImage = () => {
    setQuestionImage(null);
    setQuestionImagePreview(null);
  };

  const removeOptionImage = (index: number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], image: null, imagePreview: null };
    setOptions(newOptions);
  };

  const validateForm = (): boolean => {
    setValidationError(null);

    // Check if question has either text or image
    if (!questionText.trim() && !questionImage) {
      setValidationError('Question must have either text or an image');
      return false;
    }

    // Check if at least one option has content
    const hasValidOption = options.some(opt => opt.text.trim() || opt.image);
    if (!hasValidOption) {
      setValidationError('At least one option must have text or an image');
      return false;
    }

    // Check if explanation is provided
    if (!explanation.trim()) {
      setValidationError('Explanation is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSuccessMessage(null);

    try {
      const formattedOptions = options.map(opt => ({
        optionText: opt.text.trim() || undefined,
        optionImage: opt.image || undefined,
      }));

      const questionId = await createQuestionMutation.mutateAsync({
        questionText: questionText.trim() || null,
        questionImage: questionImage,
        options: formattedOptions,
        correctAnswerIndex: BigInt(correctAnswerIndex),
        explanation: explanation.trim(),
        subject,
        classLevel,
      });

      setSuccessMessage(`Question created successfully! ID: ${questionId.toString()}`);
      
      // Reset form
      setQuestionText('');
      setQuestionImage(null);
      setQuestionImagePreview(null);
      setOptions([
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null },
      ]);
      setCorrectAnswerIndex('0');
      setExplanation('');
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setValidationError(error.message || 'Failed to create question');
    }
  };

  if (isInitializing) {
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
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create Question</h1>
          <p className="text-muted-foreground">
            Add a new question to the question bank
          </p>
        </div>

        {successMessage && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {validationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Section */}
          <Card>
            <CardHeader>
              <CardTitle>Question</CardTitle>
              <CardDescription>Enter question text and/or upload an image</CardDescription>
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
                <Label htmlFor="questionImage">Question Image (Optional)</Label>
                {questionImagePreview ? (
                  <div className="relative">
                    <img
                      src={questionImagePreview}
                      alt="Question preview"
                      className="max-h-64 rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={removeQuestionImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="questionImage"
                      type="file"
                      accept="image/*"
                      onChange={handleQuestionImageUpload}
                      className="cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Options Section */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>Enter text and/or upload images for each option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {options.map((option, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Option {index + 1}</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`option-text-${index}`}>Text (Optional)</Label>
                    <Input
                      id={`option-text-${index}`}
                      placeholder={`Enter option ${index + 1} text...`}
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`option-image-${index}`}>Image (Optional)</Label>
                    {option.imagePreview ? (
                      <div className="relative">
                        <img
                          src={option.imagePreview}
                          alt={`Option ${index + 1} preview`}
                          className="max-h-32 rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => removeOptionImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          id={`option-image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionImageUpload(index, e)}
                          className="cursor-pointer"
                        />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Correct Answer Section */}
          <Card>
            <CardHeader>
              <CardTitle>Correct Answer</CardTitle>
              <CardDescription>Select the correct option</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={correctAnswerIndex} onValueChange={setCorrectAnswerIndex}>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                      <Label htmlFor={`answer-${index}`} className="cursor-pointer">
                        Option {index + 1}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
              <CardDescription>Provide an explanation for the correct answer</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter the explanation..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Metadata Section */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Select subject and class level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={(value) => setSubject(value as Subject)}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Subject.physics}>Physics</SelectItem>
                    <SelectItem value={Subject.chemistry}>Chemistry</SelectItem>
                    <SelectItem value={Subject.maths}>Mathematics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Select value={classLevel} onValueChange={(value) => setClassLevel(value as ClassLevel)}>
                  <SelectTrigger id="classLevel">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClassLevel.class11th}>11th</SelectItem>
                    <SelectItem value={ClassLevel.class12th}>12th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createQuestionMutation.isPending}
              className="flex-1"
            >
              {createQuestionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Question'
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
