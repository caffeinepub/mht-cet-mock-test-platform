import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullSyllabusTests, useChapterWiseTests, useChapterWiseTestById } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, BookOpen, Users, FileText, Plus, Clock, Award } from 'lucide-react';
import { useEffect } from 'react';
import type { ChapterWiseTestDetails, ClassLevel, Subject } from '../backend';

interface TestWithDetails {
  testId: bigint;
  testName: string;
  createdAt: bigint;
  details: ChapterWiseTestDetails | null;
}

export default function AdminDashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: fullSyllabusTests = [], isLoading: testsLoading } = useFullSyllabusTests();
  const { data: chapterWiseTests = [], isLoading: chapterWiseTestsLoading } = useChapterWiseTests();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

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

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tests, questions, and monitor platform analytics
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tests">Test Management</TabsTrigger>
            <TabsTrigger value="questions">Question Gallery</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Registered students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests Created</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fullSyllabusTests.length + chapterWiseTests.length}</div>
                  <p className="text-xs text-muted-foreground">Published tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Test submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">In question bank</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>
                  Analytics and insights will appear here once data is available
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No data available yet</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Test Management</h2>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate({ to: '/admin/tests/chapter-wise/create' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Chapter-Wise Test
                </Button>
                <Button onClick={() => navigate({ to: '/admin/tests/full-syllabus/create' })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Full Syllabus Test
                </Button>
              </div>
            </div>

            {/* Full Syllabus Tests Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Full Syllabus Tests</h3>
              {fullSyllabusTests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[200px] items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No Full Syllabus Tests</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Create your first Full Syllabus Test
                      </p>
                      <Button onClick={() => navigate({ to: '/admin/tests/full-syllabus/create' })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Full Syllabus Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {fullSyllabusTests.map((test) => (
                    <Card key={test.testId.toString()}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{test.testName}</CardTitle>
                            <CardDescription className="mt-1">
                              Created on {formatDate(test.createdAt)}
                            </CardDescription>
                          </div>
                          <Badge>Full Syllabus</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>2 sections, 90+90 minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {test.section1.questionIds.length + test.section2.questionIds.length} questions total
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>Section 1: 1 mark, Section 2: 2 marks</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter-Wise Tests Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chapter-Wise Tests</h3>
              {chapterWiseTestsLoading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Loading chapter-wise tests...</p>
                  </div>
                </div>
              ) : chapterWiseTests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[200px] items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No Chapter-Wise Tests</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Create your first Chapter-Wise Test
                      </p>
                      <Button onClick={() => navigate({ to: '/admin/tests/chapter-wise/create' })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Chapter-Wise Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AdminChapterWiseTestsDisplay tests={chapterWiseTests} formatDate={formatDate} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Question Gallery</h2>
              <Button onClick={() => navigate({ to: '/admin/questions/create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Question
              </Button>
            </div>

            <Card className="border-dashed">
              <CardContent className="flex min-h-[300px] items-center justify-center py-12">
                <div className="text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Question Gallery</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    View and manage all questions in the question bank
                  </p>
                  <Button onClick={() => navigate({ to: '/admin/questions/create' })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
            </div>

            <Card className="border-dashed">
              <CardContent className="flex min-h-[300px] items-center justify-center py-12">
                <div className="text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    User management features will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AdminChapterWiseTestsDisplayProps {
  tests: Array<{ testId: bigint; testName: string; createdAt: bigint; isActive: boolean }>;
  formatDate: (timestamp: bigint) => string;
}

function AdminChapterWiseTestsDisplay({ tests, formatDate }: AdminChapterWiseTestsDisplayProps) {
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
    testName: test.testName,
    createdAt: test.createdAt,
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
        <CardContent className="flex min-h-[200px] items-center justify-center py-12">
          <div className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Chapter-Wise Tests</h3>
            <p className="text-sm text-muted-foreground">
              Chapter-wise tests will appear here once created
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* 11th Standard Tests */}
      <AdminClassLevelSection
        title="11th Standard"
        classLevel="class11th"
        groupedTests={groupedTests.class11th}
        formatDate={formatDate}
      />

      {/* 12th Standard Tests */}
      <AdminClassLevelSection
        title="12th Standard"
        classLevel="class12th"
        groupedTests={groupedTests.class12th}
        formatDate={formatDate}
      />
    </div>
  );
}

interface AdminClassLevelSectionProps {
  title: string;
  classLevel: string;
  groupedTests: {
    physics: TestWithDetails[];
    chemistry: TestWithDetails[];
    maths: TestWithDetails[];
  };
  formatDate: (timestamp: bigint) => string;
}

function AdminClassLevelSection({ title, classLevel, groupedTests, formatDate }: AdminClassLevelSectionProps) {
  const hasTests = groupedTests.physics.length > 0 || groupedTests.chemistry.length > 0 || groupedTests.maths.length > 0;

  if (!hasTests) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">{title}</h4>
      
      {/* Physics Tests */}
      {groupedTests.physics.length > 0 && (
        <AdminSubjectSection
          subject="Physics"
          tests={groupedTests.physics}
          formatDate={formatDate}
        />
      )}

      {/* Chemistry Tests */}
      {groupedTests.chemistry.length > 0 && (
        <AdminSubjectSection
          subject="Chemistry"
          tests={groupedTests.chemistry}
          formatDate={formatDate}
        />
      )}

      {/* Mathematics Tests */}
      {groupedTests.maths.length > 0 && (
        <AdminSubjectSection
          subject="Mathematics"
          tests={groupedTests.maths}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

interface AdminSubjectSectionProps {
  subject: string;
  tests: TestWithDetails[];
  formatDate: (timestamp: bigint) => string;
}

function AdminSubjectSection({ subject, tests, formatDate }: AdminSubjectSectionProps) {
  return (
    <div className="space-y-3">
      <h5 className="text-base font-medium text-muted-foreground">{subject}</h5>
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map(test => (
          <Card key={test.testId.toString()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{test.testName}</CardTitle>
                  <CardDescription className="mt-1">
                    Created on {formatDate(test.createdAt)}
                  </CardDescription>
                </div>
                <Badge variant="outline">Chapter-Wise</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{test.details?.durationMinutes.toString()} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{test.details?.questions.length} questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>{test.details?.marksPerQuestion.toString()} marks per question</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
