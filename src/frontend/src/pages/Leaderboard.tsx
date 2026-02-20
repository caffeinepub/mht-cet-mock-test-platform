import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Construction, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Leaderboard() {
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
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
        <Button
          onClick={() => navigate({ to: '/dashboard' })}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-[oklch(0.145_0_240)] to-[oklch(0.165_0_240)] text-white">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <CardTitle className="text-3xl">Leaderboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Construction className="mb-4 h-16 w-16 text-amber-500" />
              <h3 className="mb-4 text-2xl font-bold">Leaderboard Coming Soon</h3>
              
              <div className="mb-6 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-left">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Feature Under Development
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                      The leaderboard feature is currently being developed. This requires backend implementation for test attempts and scoring.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-muted-foreground">
                Once the backend is complete, you'll be able to:
              </p>

              <ul className="mb-6 space-y-2 text-left text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>View top 10 scorers for each test</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>See rankings with scores and completion times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Track your position among all test takers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Compete with other students for top ranks</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate({ to: '/dashboard' })}
            size="lg"
            className="bg-[oklch(0.145_0_240)] hover:bg-[oklch(0.165_0_240)]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
