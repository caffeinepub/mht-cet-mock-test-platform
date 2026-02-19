import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';

export default function TestInterface() {
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
          <p className="text-muted-foreground">Loading test...</p>
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
          <CardContent className="flex min-h-[60vh] items-center justify-center py-12">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">Test Interface</h2>
              <p className="text-muted-foreground">Test ID: {testId}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Test interface will be implemented with backend integration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
