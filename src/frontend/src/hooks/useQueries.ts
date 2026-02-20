import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FullSyllabusTest, Question, UserProfile, ChapterWiseTestDetails } from '../backend';
import { UserRole__1 } from '../backend';

// Full Syllabus Test Hooks
export function useFullSyllabusTests() {
  const { actor, isFetching } = useActor();

  return useQuery<FullSyllabusTest[]>({
    queryKey: ['fullSyllabusTests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFullSyllabusTests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFullSyllabusTestById(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FullSyllabusTest | null>({
    queryKey: ['fullSyllabusTest', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return null;
      const tests = await actor.getFullSyllabusTests();
      return tests.find(test => test.testId === testId) || null;
    },
    enabled: !!actor && !isFetching && testId !== null,
  });
}

// Chapter-Wise Test Hooks
export interface ChapterWiseTest {
  testId: bigint;
  testName: string;
  createdAt: bigint;
  testType: { chapterWise: null } | { fullSyllabus: null };
  isActive: boolean;
  marksPerQuestion?: bigint;
  durationMinutes?: bigint;
  sectionCount?: bigint;
  questionIds: bigint[];
}

export function useChapterWiseTests() {
  const { actor, isFetching } = useActor();

  return useQuery<ChapterWiseTest[]>({
    queryKey: ['chapterWiseTests'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have a separate getChapterWiseTests endpoint
      // We need to filter from a unified test list or use a workaround
      // For now, return empty array - backend needs to provide this endpoint
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useChapterWiseTestById(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ChapterWiseTestDetails | null>({
    queryKey: ['chapterWiseTestDetails', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return null;
      const result = await actor.getChapterWiseTestById(testId);
      if (result.__kind__ === 'ok') {
        return result.ok;
      }
      return null;
    },
    enabled: !!actor && !isFetching && testId !== null,
    retry: false,
  });
}

// Question Hooks
export function useAllQuestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuestions();
    },
    enabled: !!actor && !isFetching,
  });
}

// User Profile Hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// User Role Hook - Returns string 'admin', 'student', or null with enhanced logging
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<'admin' | 'student' | null>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║       useGetCallerUserRole Query Execution Started            ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log(`[${timestamp}] Query enabled:`, !!actor && !actorFetching);
      console.log(`[${timestamp}] Actor available:`, !!actor);
      console.log(`[${timestamp}] Actor fetching:`, actorFetching);
      
      if (!actor) {
        console.error(`[${timestamp}] ❌ ERROR: Actor not available`);
        console.log('═══════════════════════════════════════════════════════════════');
        throw new Error('Actor not available');
      }
      
      console.log(`[${timestamp}] ✓ Calling actor.getUserRole()...`);
      const startTime = performance.now();
      
      let role;
      try {
        role = await actor.getUserRole();
        const endTime = performance.now();
        console.log(`[${timestamp}] ✓ Backend call completed in ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error(`[${timestamp}] ❌ ERROR calling getUserRole:`, error);
        console.log('═══════════════════════════════════════════════════════════════');
        throw error;
      }
      
      console.log('');
      console.log('--- Raw Backend Response Analysis ---');
      console.log(`[${timestamp}] Raw response:`, role);
      console.log(`[${timestamp}] Response type:`, typeof role);
      console.log(`[${timestamp}] Response constructor:`, role?.constructor?.name);
      console.log(`[${timestamp}] Response stringified:`, JSON.stringify(role));
      console.log(`[${timestamp}] Response keys:`, Object.keys(role || {}));
      console.log(`[${timestamp}] Response has __kind__:`, '__kind__' in (role || {}));
      if ('__kind__' in (role || {})) {
        console.log(`[${timestamp}] Response.__kind__ value:`, (role as any).__kind__);
      }
      console.log('');
      console.log('--- Variant Parsing Logic ---');
      
      // Parse the UserRole variant from backend
      // Backend returns { #admin } or { #student } which gets converted to enum by agent
      let parsedRole: 'admin' | 'student' | null = null;
      
      // Strategy 1: Check if response has __kind__ property (variant structure)
      if (role && typeof role === 'object' && '__kind__' in role) {
        const kind = (role as any).__kind__;
        console.log(`[${timestamp}] Strategy 1: Detected variant with __kind__: "${kind}"`);
        
        if (kind === 'admin') {
          parsedRole = 'admin';
          console.log(`[${timestamp}] ✓ Parsed as: admin`);
        } else if (kind === 'student') {
          parsedRole = 'student';
          console.log(`[${timestamp}] ✓ Parsed as: student`);
        } else {
          console.log(`[${timestamp}] ⚠ Unknown variant kind: "${kind}"`);
        }
      } 
      // Strategy 2: Check if it's a string enum value
      else if (typeof role === 'string') {
        console.log(`[${timestamp}] Strategy 2: Detected string enum value: "${role}"`);
        
        if (role === 'admin') {
          parsedRole = 'admin';
          console.log(`[${timestamp}] ✓ Parsed as: admin`);
        } else if (role === 'student') {
          parsedRole = 'student';
          console.log(`[${timestamp}] ✓ Parsed as: student`);
        } else {
          console.log(`[${timestamp}] ⚠ Unknown string value: "${role}"`);
        }
      }
      // Strategy 3: Fallback - check object keys for variant tag
      else if (role && typeof role === 'object') {
        const keys = Object.keys(role);
        console.log(`[${timestamp}] Strategy 3: Checking object keys for variant tag:`, keys);
        
        if (keys.includes('admin') || keys[0] === 'admin') {
          parsedRole = 'admin';
          console.log(`[${timestamp}] ✓ Found 'admin' key, parsed as: admin`);
        } else if (keys.includes('student') || keys[0] === 'student') {
          parsedRole = 'student';
          console.log(`[${timestamp}] ✓ Found 'student' key, parsed as: student`);
        } else {
          console.log(`[${timestamp}] ⚠ No recognized variant tag in keys`);
        }
      } else {
        console.log(`[${timestamp}] ⚠ Unexpected response format - all strategies failed`);
      }
      
      console.log('');
      console.log('--- Final Result ---');
      console.log(`[${timestamp}] Final parsed role:`, parsedRole);
      console.log(`[${timestamp}] Type of parsed role:`, typeof parsedRole);
      console.log(`[${timestamp}] Is null:`, parsedRole === null);
      console.log(`[${timestamp}] Is 'admin':`, parsedRole === 'admin');
      console.log(`[${timestamp}] Is 'student':`, parsedRole === 'student');
      console.log(`[${timestamp}] NOT 'admin':`, parsedRole !== 'admin');
      console.log('═══════════════════════════════════════════════════════════════');
      
      return parsedRole;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return query;
}

// Admin Check Hook
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║          useIsCallerAdmin Query Execution Started             ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log(`[${timestamp}] Query enabled:`, !!actor && !actorFetching);
      console.log(`[${timestamp}] Actor available:`, !!actor);
      
      if (!actor) {
        console.error(`[${timestamp}] ❌ ERROR: Actor not available`);
        console.log('═══════════════════════════════════════════════════════════════');
        throw new Error('Actor not available');
      }
      
      console.log(`[${timestamp}] ✓ Calling actor.isCallerAdmin()...`);
      const startTime = performance.now();
      
      let isAdmin;
      try {
        isAdmin = await actor.isCallerAdmin();
        const endTime = performance.now();
        console.log(`[${timestamp}] ✓ Backend call completed in ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error(`[${timestamp}] ❌ ERROR calling isCallerAdmin:`, error);
        console.log('═══════════════════════════════════════════════════════════════');
        throw error;
      }
      
      console.log('');
      console.log('--- Response Analysis ---');
      console.log(`[${timestamp}] Raw response:`, isAdmin);
      console.log(`[${timestamp}] Response type:`, typeof isAdmin);
      console.log(`[${timestamp}] Boolean value:`, Boolean(isAdmin));
      console.log('═══════════════════════════════════════════════════════════════');
      
      return Boolean(isAdmin);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return query;
}
