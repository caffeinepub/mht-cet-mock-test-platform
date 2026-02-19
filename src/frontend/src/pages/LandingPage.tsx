import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { BookOpen, Clock, Trophy, Users } from 'lucide-react';
import { SiYoutube, SiTelegram } from 'react-icons/si';

export default function LandingPage() {
  const navigate = useNavigate();
  const { identity, login, isLoggingIn } = useInternetIdentity();

  const handleGetStarted = () => {
    if (identity) {
      navigate({ to: '/dashboard' });
    } else {
      login();
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* White background with faint students studying image */}
      <div className="fixed inset-0 z-0 bg-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ 
            backgroundImage: 'url(/assets/generated/students-studying-bg.dim_1920x1080.png)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Image Banner */}
        <div className="w-full overflow-hidden bg-[oklch(0.145_0_240)]">
          <img
            src="/assets/photo_2026-02-19_19-46-20.jpg"
            alt="Concept Delta - Master MHT-CET"
            className="h-auto w-full object-cover object-center"
            style={{ maxHeight: '400px' }}
          />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[oklch(0.145_0_240)] to-[oklch(0.205_0_240)] py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Practice MHT-CET with Real Exam-Level Mock Tests
            </h1>
            
            {/* Tagline */}
            <div className="mb-6">
              <p className="text-lg font-bold md:text-xl">
                Founded by COEP Technological University students
              </p>
              <p className="text-sm text-white/70 md:text-base">
                One of Maharashtra's top engineering institutions
              </p>
            </div>

            <p className="mb-8 text-base text-white/80 md:text-lg">
              Master Physics, Chemistry, and Mathematics with our comprehensive mock tests designed specifically for Maharashtra CET aspirants.
            </p>
          </div>
        </section>

        {/* YouTube Subscription Section */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
              <div className="mb-6 flex items-center justify-center gap-4">
                <img 
                  src="/assets/generated/teacher-teaching.dim_400x300.png" 
                  alt="Teacher teaching students" 
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Subscribe to Unlock Tests</h2>
                  <p className="text-gray-600">Subscribe to our YouTube channel to access all mock tests</p>
                </div>
              </div>
              <Button
                size="lg"
                asChild
                className="w-full bg-red-600 text-white hover:bg-red-700"
              >
                <a
                  href="https://youtube.com/@conceptdelta2026?si=QAplvhCH-B-GqYhu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <SiYoutube className="h-6 w-6" />
                  Subscribe to Concept Delta
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Telegram Channel Section */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
              <div className="mb-6 flex items-center justify-center gap-4">
                <img 
                  src="/assets/generated/study-notes.dim_400x300.png" 
                  alt="Study notes" 
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Join Telegram</h2>
                  <p className="text-gray-600">Join Telegram for test explanation</p>
                </div>
              </div>
              <Button
                size="lg"
                asChild
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                <a
                  href="https://t.me/Conceptdelta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <SiTelegram className="h-6 w-6" />
                  Join Concept Delta on Telegram
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white/95 py-16 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold text-[oklch(0.145_0_240)] md:text-4xl">
              Click here to start CET with COEPian Guidance
            </h2>
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoggingIn}
              className="bg-[oklch(0.145_0_240)] text-white hover:bg-[oklch(0.205_0_240)]"
            >
              {isLoggingIn ? 'Connecting...' : 'Get Started for Free'}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white/90 py-20 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-[oklch(0.145_0_240)] md:text-4xl">
              Why Choose Concept Delta?
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[oklch(0.145_0_240)]/20 bg-white/95">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[oklch(0.145_0_240)] text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle>Comprehensive Tests</CardTitle>
                  <CardDescription>
                    Full syllabus mock tests and chapter-wise practice for Physics, Chemistry, and Mathematics
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-[oklch(0.145_0_240)]/20 bg-white/95">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[oklch(0.145_0_240)] text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                  <CardTitle>Real Exam Simulation</CardTitle>
                  <CardDescription>
                    Timed tests with two sections matching actual MHT-CET pattern and difficulty
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-[oklch(0.145_0_240)]/20 bg-white/95">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[oklch(0.145_0_240)] text-white">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <CardTitle>Leaderboards</CardTitle>
                  <CardDescription>
                    Compete with thousands of aspirants and track your performance against top scorers
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-[oklch(0.145_0_240)]/20 bg-white/95">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[oklch(0.145_0_240)] text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <CardDescription>
                    Get comprehensive explanations, time breakdowns, and personalized insights
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
