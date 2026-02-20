import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Construction } from 'lucide-react';
import { useEffect } from 'react';

export default function TestInterface() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();

  // Redirect if not authenticated
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
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <Construction className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <CardTitle className="text-2xl">Test Interface Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-left">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Feature Under Development
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    The test-taking interface is currently being developed. This feature requires backend implementation for test attempts, section management, and answer submission.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground">
              Once the backend is complete, you'll be able to:
            </p>

            <ul className="space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Take timed tests with automatic submission</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Answer multiple-choice questions with instant feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Track your progress through test sections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>View detailed results and explanations</span>
              </li>
            </ul>

            <div className="pt-4">
              <Button onClick={() => navigate({ to: '/dashboard' })} size="lg">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
