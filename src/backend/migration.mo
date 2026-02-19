import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
  };

  type Option = {
    optionText : ?Text;
    optionImage : ?Text;
  };

  type Question = {
    id : Nat;
    questionText : ?Text;
    questionImage : ?Text;
    options : [Option];
    correctAnswerIndex : Nat;
    explanation : Text;
    subject : Subject;
    classLevel : ClassLevel;
  };

  type Subject = {
    #physics;
    #chemistry;
    #maths;
  };

  type ClassLevel = {
    #class11th;
    #class12th;
  };

  type TestSection = {
    name : Text;
    durationMinutes : Nat;
    subjects : [Subject];
    marksPerQuestion : Nat;
    questionIds : [Nat];
  };

  type FullSyllabusTest = {
    testId : Nat;
    testName : Text;
    createdAt : Int;
    section1 : TestSection;
    section2 : TestSection;
    isActive : Bool;
  };

  type Answer = {
    questionId : Nat;
    selectedOptionIndex : Nat;
  };

  type SectionStatus = {
    status : {
      #notStarted;
      #inProgress;
      #submitted;
    };
    timestamp : Int;
  };

  type TestAttemptStatus = {
    section1 : SectionStatus;
    section2 : SectionStatus;
    overall : { #notStarted; #inProgress; #completed };
  };

  // Old TestAttempt type (without score fields)
  type OldTestAttempt = {
    attemptId : Nat;
    testId : Nat;
    userId : Principal;
    createdAt : Int;
    currentSection : Nat;
    section1StartTime : ?Int;
    section2StartTime : ?Int;
    section1SubmittedAt : ?Int;
    section2SubmittedAt : ?Int;
    isCompleted : Bool;
    section1Answers : [Answer];
    section2Answers : [Answer];
  };

  // New TestAttempt type (with score fields)
  type NewTestAttempt = {
    attemptId : Nat;
    testId : Nat;
    userId : Principal;
    createdAt : Int;
    currentSection : Nat;
    section1StartTime : ?Int;
    section2StartTime : ?Int;
    section1SubmittedAt : ?Int;
    section2SubmittedAt : ?Int;
    isCompleted : Bool;
    section1Answers : [Answer];
    section2Answers : [Answer];
    section1Score : Nat;
    section2Score : Nat;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    questions : Map.Map<Nat, Question>;
    fullSyllabusTests : Map.Map<Nat, FullSyllabusTest>;
    nextQuestionId : Nat;
    nextTestId : Nat;
    currentTestId : ?Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    questions : Map.Map<Nat, Question>;
    fullSyllabusTests : Map.Map<Nat, FullSyllabusTest>;
    testAttempts : Map.Map<Nat, NewTestAttempt>;
    sectionStatuses : Map.Map<Nat, TestAttemptStatus>;
    nextQuestionId : Nat;
    nextTestId : Nat;
    currentTestId : ?Nat;
    nextTestAttemptId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let emptyTestAttempts = Map.empty<Nat, NewTestAttempt>();
    let emptySectionStatuses = Map.empty<Nat, TestAttemptStatus>();

    {
      old with
      testAttempts = emptyTestAttempts;
      sectionStatuses = emptySectionStatuses;
      nextTestAttemptId = 0;
    };
  };
};
