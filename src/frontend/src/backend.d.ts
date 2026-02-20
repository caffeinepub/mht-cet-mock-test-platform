import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    userName: string;
    rank: bigint;
    totalScore: bigint;
    totalTimeTaken: bigint;
}
export interface ChapterWiseTestDetails {
    testName: string;
    durationMinutes: bigint;
    questions: Array<Question>;
    marksPerQuestion: bigint;
}
export interface FullSyllabusTest {
    createdAt: bigint;
    testName: string;
    isActive: boolean;
    section1: TestSection;
    section2: TestSection;
    testId: bigint;
}
export interface TestAttempt {
    section2SubmittedAt?: bigint;
    section1Score: bigint;
    attemptId: bigint;
    isCompleted: boolean;
    section1StartTime?: bigint;
    singleSectionSubmittedAt?: bigint;
    userId: Principal;
    createdAt: bigint;
    section1Answers: Array<Answer>;
    currentSection: bigint;
    section2Score: bigint;
    totalScore: bigint;
    totalTimeTaken: bigint;
    section2Answers: Array<Answer>;
    section1SubmittedAt?: bigint;
    singleSectionScore: bigint;
    testId: bigint;
    completionTimestamp: bigint;
    singleSectionStartTime?: bigint;
    singleSectionAnswers: Array<Answer>;
    section2StartTime?: bigint;
}
export interface TestSection {
    subjects: Array<Subject>;
    name: string;
    durationMinutes: bigint;
    questionIds: Array<bigint>;
    marksPerQuestion: bigint;
}
export interface Option {
    optionImage?: string;
    optionText?: string;
}
export interface Answer {
    selectedOptionIndex: bigint;
    questionId: bigint;
}
export interface Question {
    id: bigint;
    subject: Subject;
    explanation?: string;
    questionImage?: string;
    questionText?: string;
    correctAnswerIndex: bigint;
    classLevel: ClassLevel;
    options: Array<Option>;
}
export interface UserProfile {
    name: string;
}
export enum ClassLevel {
    class11th = "class11th",
    class12th = "class12th"
}
export enum Subject {
    maths = "maths",
    chemistry = "chemistry",
    physics = "physics"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignQuestionsToChapterWiseTest(testId: bigint, questionIds: Array<bigint>): Promise<void>;
    assignQuestionsToTest(testId: bigint, section1QuestionIds: Array<bigint>, section2QuestionIds: Array<bigint>): Promise<void>;
    createChapterWiseTest(testName: string, marksPerQuestion: bigint, durationMinutes: bigint): Promise<bigint>;
    createFullSyllabusTest(testName: string): Promise<bigint>;
    createQuestion(questionText: string | null, questionImage: string | null, options: Array<Option>, correctAnswerIndex: bigint, explanation: string | null, subject: Subject, classLevel: ClassLevel): Promise<bigint>;
    deleteQuestion(id: bigint): Promise<void>;
    getAllQuestions(): Promise<Array<Question>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapterWiseTestById(testId: bigint): Promise<{
        __kind__: "ok";
        ok: ChapterWiseTestDetails;
    } | {
        __kind__: "testNotFound";
        testNotFound: null;
    }>;
    getCurrentTestId(): Promise<bigint | null>;
    getFullSyllabusTests(): Promise<Array<FullSyllabusTest>>;
    getLeaderboard(testId: bigint): Promise<Array<LeaderboardEntry>>;
    getQuestion(id: bigint): Promise<Question | null>;
    getQuestionsByClassLevel(classLevel: ClassLevel): Promise<Array<Question>>;
    getQuestionsBySubject(subject: Subject): Promise<Array<Question>>;
    getTestAttempt(attemptId: bigint): Promise<TestAttempt | null>;
    getTotalQuestions(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTestAttempts(userId: Principal): Promise<Array<TestAttempt>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSection(attemptId: bigint, sectionNumber: bigint): Promise<void>;
    startTest(testId: bigint): Promise<bigint>;
    submitSection(attemptId: bigint, sectionNumber: bigint, answers: Array<Answer>): Promise<{
        score: bigint;
        correctAnswers: bigint;
    }>;
}
