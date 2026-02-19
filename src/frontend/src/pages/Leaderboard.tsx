import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useEffect } from 'react';

export default function Leaderboard() {
  const { testId } = useParams({ strict: false });
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
          <p className="text-muted-foreground">Loading leaderboard...</p>
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-[oklch(0.145_0_240)]" />
              <CardTitle className="text-3xl">Leaderboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Test ID: {testId}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Leaderboard will be implemented with backend integration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
