import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, BookOpen, Users, FileText, Plus } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

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
                  <div className="text-2xl font-bold">0</div>
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
              <Button onClick={() => navigate({ to: '/admin/tests/full-syllabus/create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Full Syllabus Test
              </Button>
            </div>
            <Card>
              <CardContent className="flex min-h-[300px] items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Tests Created</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first Full Syllabus Test to get started
                  </p>
                  <Button onClick={() => navigate({ to: '/admin/tests/full-syllabus/create' })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Full Syllabus Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Question Gallery</h2>
              <Button onClick={() => navigate({ to: '/admin/questions/create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Question
              </Button>
            </div>
            <Card>
              <CardContent className="flex min-h-[300px] items-center justify-center py-12">
                <div className="text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Questions Available</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Add questions to build your question bank
                  </p>
                  <Button onClick={() => navigate({ to: '/admin/questions/create' })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Card>
              <CardContent className="flex min-h-[300px] items-center justify-center py-12">
                <div className="text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Users Registered</h3>
                  <p className="text-sm text-muted-foreground">
                    User data will appear here once students register
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
