import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLeaderboard } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Medal } from 'lucide-react';
import { useEffect } from 'react';

export default function Leaderboard() {
  const { testId } = useParams({ strict: false });
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  const testIdBigInt = testId ? BigInt(testId) : null;
  const { data: leaderboard, isLoading, isError, error } = useLeaderboard(testIdBigInt);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const formatTime = (nanoseconds: bigint): string => {
    const totalSeconds = Number(nanoseconds) / 1_000_000_000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) {
      return <img src="/assets/generated/gold-medal.dim_64x64.png" alt="Gold Medal" className="h-8 w-8" />;
    } else if (rank === 2) {
      return <img src="/assets/generated/silver-medal.dim_64x64.png" alt="Silver Medal" className="h-8 w-8" />;
    } else if (rank === 3) {
      return <img src="/assets/generated/bronze-medal.dim_64x64.png" alt="Bronze Medal" className="h-8 w-8" />;
    }
    return null;
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-300 dark:border-yellow-700';
    } else if (rank === 2) {
      return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 border-gray-300 dark:border-gray-600';
    } else if (rank === 3) {
      return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-300 dark:border-orange-700';
    }
    return 'bg-card border-border';
  };

  if (isInitializing || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
              <CardTitle className="text-3xl">Leaderboard - Top 10</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="text-destructive">
                  Failed to load leaderboard: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            )}

            {!isError && leaderboard && leaderboard.length === 0 && (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <Medal className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <p className="text-xl font-semibold text-muted-foreground">No data yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to complete this test and appear on the leaderboard!
                </p>
              </div>
            )}

            {!isError && leaderboard && leaderboard.length > 0 && (
              <div className="space-y-3">
                {leaderboard.map((entry) => {
                  const rank = Number(entry.rank);
                  const isTopThree = rank <= 3;

                  return (
                    <div
                      key={rank}
                      className={`flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md ${getRankBackground(rank)}`}
                    >
                      {/* Rank and Medal */}
                      <div className="flex w-16 flex-shrink-0 items-center justify-center">
                        {isTopThree ? (
                          getMedalIcon(rank)
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                            {rank}
                          </div>
                        )}
                      </div>

                      {/* User Name */}
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-semibold ${isTopThree ? 'text-lg' : 'text-base'}`}>
                          {entry.userName}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-end">
                        <p className={`font-bold ${isTopThree ? 'text-xl' : 'text-lg'} text-primary`}>
                          {entry.totalScore.toString()} marks
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Time: {formatTime(entry.totalTimeTaken)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
