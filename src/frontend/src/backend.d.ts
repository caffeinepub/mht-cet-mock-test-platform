import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ChapterWiseTestDetails {
    testName: string;
    durationMinutes: bigint;
    questions: Array<Question>;
    marksPerQuestion: bigint;
}
export type RegistrationResult = {
    __kind__: "internalError";
    internalError: null;
} | {
    __kind__: "success";
    success: {
        registeredPrincipal: Principal;
        timestamp: bigint;
    };
} | {
    __kind__: "alreadyRegistered";
    alreadyRegistered: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface FullSyllabusTest {
    createdAt: bigint;
    testName: string;
    isActive: boolean;
    section1: TestSection;
    section2: TestSection;
    testId: bigint;
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
    student = "student"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    assignQuestionsToChapterWiseTest(testId: bigint, questionIds: Array<bigint>): Promise<void>;
    assignQuestionsToTest(testId: bigint, section1QuestionIds: Array<bigint>, section2QuestionIds: Array<bigint>): Promise<void>;
    createChapterWiseTest(testName: string, marksPerQuestion: bigint, durationMinutes: bigint): Promise<bigint>;
    createFullSyllabusTest(testName: string): Promise<bigint>;
    createQuestion(questionText: string | null, questionImage: string | null, options: Array<Option>, correctAnswerIndex: bigint, explanation: string | null, subject: Subject, classLevel: ClassLevel): Promise<bigint>;
    deleteQuestion(id: bigint): Promise<void>;
    getAllQuestions(): Promise<Array<Question>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getChapterWiseTestById(testId: bigint): Promise<{
        __kind__: "ok";
        ok: ChapterWiseTestDetails;
    } | {
        __kind__: "testNotFound";
        testNotFound: null;
    }>;
    getFullSyllabusTests(): Promise<Array<FullSyllabusTest>>;
    getQuestion(id: bigint): Promise<Question | null>;
    getQuestionsByClassLevel(classLevel: ClassLevel): Promise<Array<Question>>;
    getQuestionsBySubject(subject: Subject): Promise<Array<Question>>;
    getTotalQuestions(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    registerAdmin(newAdmin: Principal): Promise<RegistrationResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
