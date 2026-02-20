import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetFullSyllabusTests, useChapterWiseTests } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ChapterWiseTestDetails, ClassLevel, Subject } from '../backend';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TestWithDetails {
  testId: bigint;
  details: ChapterWiseTestDetails | null;
}

export default function StudentDashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: tests = [], isLoading: testsLoading } = useGetFullSyllabusTests();
  const { data: chapterWiseTests = [], isLoading: chapterWiseTestsLoading } = useChapterWiseTests();
  const [startingTest, setStartingTest] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleStartTest = async (testId: bigint) => {
    // Test attempt functionality not yet implemented in backend
    setStartingTest(testId.toString());
    
    // Show alert that feature is coming soon
    setTimeout(() => {
      setStartingTest(null);
      alert('Test-taking functionality is coming soon! The backend is still being developed.');
    }, 500);
  };

  if (isInitializing || testsLoading) {
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

  const activeTests = tests.filter(test => test.isActive);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome to Concept Delta</h1>
          <p className="text-muted-foreground">
            Start practicing with our comprehensive MHT-CET mock tests
          </p>
        </div>

        {/* Feature Notice */}
        <Alert className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Test-Taking Feature Coming Soon</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            The test-taking functionality is currently under development. You can view available tests below, but taking tests will be enabled once the backend implementation is complete.
          </AlertDescription>
        </Alert>

        {/* Full Syllabus Mock Tests Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Full Syllabus Mock Tests</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeTests.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Tests Available Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for new mock tests and practice materials
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeTests.map((test) => (
                <Card key={test.testId.toString()} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{test.testName}</CardTitle>
                    <CardDescription>Full Syllabus Mock Test</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-accent/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Section 1</h4>
                          <Badge variant="secondary">
                            {test.section1.questionIds.length} Questions
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{test.section1.durationMinutes.toString()} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-3 w-3" />
                            <span>{test.section1.marksPerQuestion.toString()} mark per question</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-accent/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Section 2</h4>
                          <Badge variant="secondary">
                            {test.section2.questionIds.length} Questions
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{test.section2.durationMinutes.toString()} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-3 w-3" />
                            <span>{test.section2.marksPerQuestion.toString()} marks per question</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleStartTest(test.testId)}
                      disabled={startingTest === test.testId.toString()}
                    >
                      {startingTest === test.testId.toString() ? 'Starting...' : 'Start Test'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Chapter-Wise Tests Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Chapter-Wise Tests</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chapterWiseTests.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Chapter-Wise Tests Available Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for chapter-specific practice tests
                  </p>
                </CardContent>
              </Card>
            ) : (
              chapterWiseTests.map((test) => (
                <Card key={test.testId.toString()} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{test.testName}</CardTitle>
                    <CardDescription>Chapter-Wise Test</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Duration: N/A</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Questions: N/A</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>Marks: N/A</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleStartTest(test.testId)}
                      disabled={startingTest === test.testId.toString()}
                    >
                      {startingTest === test.testId.toString() ? 'Starting...' : 'Start Test'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
