import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullSyllabusTests } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const { data: tests = [], isLoading: testsLoading } = useFullSyllabusTests();
  const [startingTest, setStartingTest] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const handleStartTest = async (testId: bigint) => {
    if (!actor) return;
    
    setStartingTest(testId.toString());
    
    try {
      // Start the test and get attempt ID
      await actor.startTest(testId);
      
      // Get the user's test attempts to find the newly created one
      const attempts = await actor.getUserTestAttempts(identity!.getPrincipal());
      const latestAttempt = attempts
        .filter(a => a.testId === testId)
        .sort((a, b) => Number(b.createdAt - a.createdAt))[0];
      
      if (latestAttempt) {
        // Start Section 1
        await actor.startSection(latestAttempt.attemptId, BigInt(1));
        
        // Navigate to test interface with attemptId
        navigate({
          to: '/test/$testId',
          params: { testId: testId.toString() },
          search: { attemptId: latestAttempt.attemptId.toString() },
        });
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setStartingTest(null);
    }
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

        {/* Available Tests Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Available Tests</h2>
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
                      {startingTest === test.testId.toString() ? 'Starting...' : 'Start Test'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
