import { createRootRoute, createRoute } from '@tanstack/react-router';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuestionCreate from './pages/AdminQuestionCreate';
import AdminFullSyllabusTestCreate from './pages/AdminFullSyllabusTestCreate';
import AdminChapterWiseTestCreate from './pages/AdminChapterWiseTestCreate';
import TestInterface from './pages/TestInterface';
import ResultPage from './pages/ResultPage';
import Leaderboard from './pages/Leaderboard';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const studentDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: StudentDashboard,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
});

const adminQuestionCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/questions/create',
  component: AdminQuestionCreate,
});

const adminFullSyllabusTestCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/tests/full-syllabus/create',
  component: AdminFullSyllabusTestCreate,
});

const adminChapterWiseTestCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/tests/chapter-wise/create',
  component: AdminChapterWiseTestCreate,
});

const testInterfaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test/$testId',
  component: TestInterface,
});

const resultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/result/$resultId',
  component: ResultPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard/$testId',
  component: Leaderboard,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  studentDashboardRoute,
  adminDashboardRoute,
  adminQuestionCreateRoute,
  adminFullSyllabusTestCreateRoute,
  adminChapterWiseTestCreateRoute,
  testInterfaceRoute,
  resultRoute,
  leaderboardRoute,
]);
