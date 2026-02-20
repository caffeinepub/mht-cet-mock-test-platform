import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFullSyllabusTests, useChapterWiseTests, useChapterWiseTestById, useGetCallerUserRole } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, BookOpen, Users, FileText, Plus, Clock, Award, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import type { ChapterWiseTestDetails, ClassLevel, Subject } from '../backend';
import { UserRole__1 } from '../backend';

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
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();

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

  if (isInitializing || testsLoading || roleLoading) {
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
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Test Management</h2>
                <p className="text-muted-foreground">Create and manage mock tests</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate({ to: '/admin/tests/full-syllabus/create' })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Full Syllabus Test
                </Button>
                <Button onClick={() => navigate({ to: '/admin/tests/chapter-wise/create' })} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Chapter-Wise Test
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Full Syllabus Mock Tests</h3>
              {fullSyllabusTests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No full syllabus tests created yet. Click "Full Syllabus Test" to create one.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {fullSyllabusTests.map((test) => (
                    <Card key={test.testId.toString()}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{test.testName}</CardTitle>
                            <CardDescription>Created {formatDate(test.createdAt)}</CardDescription>
                          </div>
                          <Badge variant={test.isActive ? 'default' : 'secondary'}>
                            {test.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Section 1: {test.section1.durationMinutes.toString()} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Section 2: {test.section2.durationMinutes.toString()} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Section 1: {test.section1.questionIds.length} questions ({test.section1.marksPerQuestion.toString()} mark each)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Section 2: {test.section2.questionIds.length} questions ({test.section2.marksPerQuestion.toString()} marks each)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chapter-Wise Tests</h3>
              {chapterWiseTests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No chapter-wise tests created yet. Click "Chapter-Wise Test" to create one.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {chapterWiseTests.map((test) => (
                    <Card key={test.testId.toString()}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{test.testName}</CardTitle>
                            <CardDescription>Created {formatDate(test.createdAt)}</CardDescription>
                          </div>
                          <Badge variant={test.isActive ? 'default' : 'secondary'}>
                            {test.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Duration: {test.durationMinutes?.toString() || 'N/A'} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {test.questionIds.length} questions ({test.marksPerQuestion?.toString() || 'N/A'} marks each)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Question Gallery</h2>
                <p className="text-muted-foreground">Browse and manage all questions</p>
              </div>
              <Button onClick={() => navigate({ to: '/admin/questions/create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Question
              </Button>
            </div>

            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Question gallery coming soon. Use "Create Question" to add questions.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-muted-foreground">View and manage registered users</p>
            </div>

            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                User management features coming soon.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
