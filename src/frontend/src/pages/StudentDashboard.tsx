import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullSyllabusTests, useChapterWiseTests, useChapterWiseTestById } from '../hooks/useQueries';
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
  const { data: tests = [], isLoading: testsLoading } = useFullSyllabusTests();
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
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Physics + Chemistry</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{test.section1.durationMinutes.toString()} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-3.5 w-3.5" />
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
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Maths</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{test.section2.durationMinutes.toString()} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-3.5 w-3.5" />
                            <span>{test.section2.marksPerQuestion.toString()} marks per question</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleStartTest(test.testId)}
                      disabled={startingTest === test.testId.toString()}
                    >
                      {startingTest === test.testId.toString() ? 'Starting...' : 'Start Test (Coming Soon)'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Chapter-Wise Tests Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Chapter-Wise Tests</h2>
          {chapterWiseTestsLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading chapter-wise tests...</p>
              </div>
            </div>
          ) : chapterWiseTests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Chapter-Wise Tests Available</h3>
                <p className="text-sm text-muted-foreground">
                  Chapter-wise practice tests will appear here once created by admins
                </p>
              </CardContent>
            </Card>
          ) : (
            <ChapterWiseTestsDisplay tests={chapterWiseTests} onStartTest={handleStartTest} startingTest={startingTest} />
          )}
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Your Progress</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">0</CardTitle>
                <CardDescription>Tests Completed</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">-</CardTitle>
                <CardDescription>Average Score</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">-</CardTitle>
                <CardDescription>Best Rank</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

interface ChapterWiseTestsDisplayProps {
  tests: Array<{ testId: bigint; testName: string; isActive: boolean }>;
  onStartTest: (testId: bigint) => void;
  startingTest: string | null;
}

function ChapterWiseTestsDisplay({ tests, onStartTest, startingTest }: ChapterWiseTestsDisplayProps) {
  const activeTests = tests.filter(test => test.isActive);
  
  // Fetch details for all active tests
  const testDetailsQueries = activeTests.map(test => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useChapterWiseTestById(test.testId)
  );

  const allLoaded = testDetailsQueries.every(query => !query.isLoading);

  if (!allLoaded) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading test details...</p>
        </div>
      </div>
    );
  }

  // Group tests by class level and subject
  const testsWithDetails: TestWithDetails[] = activeTests.map((test, index) => ({
    testId: test.testId,
    details: testDetailsQueries[index].data || null,
  })).filter(t => t.details !== null);

  const groupedTests = {
    class11th: {
      physics: [] as TestWithDetails[],
      chemistry: [] as TestWithDetails[],
      maths: [] as TestWithDetails[],
    },
    class12th: {
      physics: [] as TestWithDetails[],
      chemistry: [] as TestWithDetails[],
      maths: [] as TestWithDetails[],
    },
  };

  // Categorize tests based on their questions
  testsWithDetails.forEach(test => {
    if (!test.details) return;

    const classLevels = new Set<ClassLevel>();
    const subjects = new Set<Subject>();

    test.details.questions.forEach(q => {
      classLevels.add(q.classLevel);
      subjects.add(q.subject);
    });

    // Add test to all relevant class level and subject combinations
    classLevels.forEach(classLevel => {
      subjects.forEach(subject => {
        const classKey = classLevel === 'class11th' ? 'class11th' : 'class12th';
        const subjectKey = subject === 'physics' ? 'physics' : subject === 'chemistry' ? 'chemistry' : 'maths';
        groupedTests[classKey][subjectKey].push(test);
      });
    });
  });

  const hasAnyTests = testsWithDetails.length > 0;

  if (!hasAnyTests) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Chapter-Wise Tests Available</h3>
          <p className="text-sm text-muted-foreground">
            Chapter-wise practice tests will appear here once created by admins
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* 11th Standard Tests */}
      <ClassLevelSection
        title="11th Standard"
        classLevel="class11th"
        groupedTests={groupedTests.class11th}
        onStartTest={onStartTest}
        startingTest={startingTest}
      />

      {/* 12th Standard Tests */}
      <ClassLevelSection
        title="12th Standard"
        classLevel="class12th"
        groupedTests={groupedTests.class12th}
        onStartTest={onStartTest}
        startingTest={startingTest}
      />
    </div>
  );
}

interface ClassLevelSectionProps {
  title: string;
  classLevel: string;
  groupedTests: {
    physics: TestWithDetails[];
    chemistry: TestWithDetails[];
    maths: TestWithDetails[];
  };
  onStartTest: (testId: bigint) => void;
  startingTest: string | null;
}

function ClassLevelSection({ title, classLevel, groupedTests, onStartTest, startingTest }: ClassLevelSectionProps) {
  const hasTests = groupedTests.physics.length > 0 || groupedTests.chemistry.length > 0 || groupedTests.maths.length > 0;

  if (!hasTests) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      
      {/* Physics Tests */}
      {groupedTests.physics.length > 0 && (
        <SubjectSection
          subject="Physics"
          tests={groupedTests.physics}
          onStartTest={onStartTest}
          startingTest={startingTest}
        />
      )}

      {/* Chemistry Tests */}
      {groupedTests.chemistry.length > 0 && (
        <SubjectSection
          subject="Chemistry"
          tests={groupedTests.chemistry}
          onStartTest={onStartTest}
          startingTest={startingTest}
        />
      )}

      {/* Mathematics Tests */}
      {groupedTests.maths.length > 0 && (
        <SubjectSection
          subject="Mathematics"
          tests={groupedTests.maths}
          onStartTest={onStartTest}
          startingTest={startingTest}
        />
      )}
    </div>
  );
}

interface SubjectSectionProps {
  subject: string;
  tests: TestWithDetails[];
  onStartTest: (testId: bigint) => void;
  startingTest: string | null;
}

function SubjectSection({ subject, tests, onStartTest, startingTest }: SubjectSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-lg font-medium text-muted-foreground">{subject}</h4>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.map(test => (
          <Card key={test.testId.toString()} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{test.details?.testName}</CardTitle>
              <CardDescription>Chapter-Wise Test</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{test.details?.durationMinutes.toString()} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{test.details?.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>{test.details?.marksPerQuestion.toString()} marks per question</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => onStartTest(test.testId)}
                disabled={startingTest === test.testId.toString()}
              >
                {startingTest === test.testId.toString() ? 'Starting...' : 'Start Test (Coming Soon)'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
