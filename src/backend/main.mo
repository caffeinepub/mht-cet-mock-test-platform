import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

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

  let questions = Map.empty<Nat, Question>();
  var nextQuestionId = 0;

  // Full Syllabus Mock Test Types
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

  let fullSyllabusTests = Map.empty<Nat, FullSyllabusTest>();
  var nextTestId = 0;

  var currentTestId : ?Nat = null;

  // Test Attempt Types
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

  type TestAttempt = {
    attemptId : Nat;
    testId : Nat;
    userId : Principal;
    createdAt : Int;
    currentSection : Nat; // 1 or 2
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

  let testAttempts = Map.empty<Nat, TestAttempt>();
  var nextTestAttemptId = 0;

  let sectionStatuses = Map.empty<Nat, TestAttemptStatus>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Question Management Functions
  public shared ({ caller }) func createQuestion(
    questionText : ?Text,
    questionImage : ?Text,
    options : [Option],
    correctAnswerIndex : Nat,
    explanation : Text,
    subject : Subject,
    classLevel : ClassLevel
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create questions");
    };
    if (options.size() != 4) {
      Runtime.trap("Exactly 4 options must be provided");
    };
    if (correctAnswerIndex >= 4) {
      Runtime.trap("correctAnswerIndex must be between 0 and 3");
    };

    let question : Question = {
      id = nextQuestionId;
      questionText;
      questionImage;
      options;
      correctAnswerIndex;
      explanation;
      subject;
      classLevel;
    };

    questions.add(nextQuestionId, question);
    nextQuestionId += 1;

    question.id;
  };

  public query ({ caller }) func getQuestion(id : Nat) : async ?Question {
    questions.get(id);
  };

  public query ({ caller }) func getQuestionsBySubject(subject : Subject) : async [Question] {
    let iter = questions.values();
    let filtered = iter.filter(
      func(q) {
        q.subject == subject;
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getQuestionsByClassLevel(classLevel : ClassLevel) : async [Question] {
    let iter = questions.values();
    let filtered = iter.filter(
      func(q) {
        q.classLevel == classLevel;
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getAllQuestions() : async [Question] {
    questions.values().toArray();
  };

  public shared ({ caller }) func deleteQuestion(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete questions");
    };

    switch (questions.get(id)) {
      case (null) { Runtime.trap("Question not found") };
      case (?_) {
        questions.remove(id);
      };
    };
  };

  public query ({ caller }) func getTotalQuestions() : async Nat {
    questions.size();
  };

  // Full Syllabus Mock Test Management
  public shared ({ caller }) func createFullSyllabusTest(testName : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create tests");
    };

    let test : FullSyllabusTest = {
      testId = nextTestId;
      testName;
      createdAt = Time.now();
      section1 = {
        name = "Physics + Chemistry";
        durationMinutes = 90;
        subjects = [#physics, #chemistry];
        marksPerQuestion = 1;
        questionIds = [];
      };
      section2 = {
        name = "Maths";
        durationMinutes = 90;
        subjects = [#maths];
        marksPerQuestion = 2;
        questionIds = [];
      };
      isActive = true;
    };

    fullSyllabusTests.add(nextTestId, test);
    nextTestId += 1;

    test.testId;
  };

  public query ({ caller }) func getFullSyllabusTests() : async [FullSyllabusTest] {
    fullSyllabusTests.values().toArray();
  };

  public shared ({ caller }) func assignQuestionsToTest(
    testId : Nat,
    section1QuestionIds : [Nat],
    section2QuestionIds : [Nat]
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign questions to tests");
    };

    switch (fullSyllabusTests.get(testId)) {
      case (null) { Runtime.trap("Test not found") };
      case (?test) {
        let validatedSection1Ids = List.fromArray<Nat>(section1QuestionIds);
        let validatedSection2Ids = List.fromArray<Nat>(section2QuestionIds);

        // Validate question IDs and subjects for section 1
        for (questionId in section1QuestionIds.values()) {
          switch (questions.get(questionId)) {
            case (null) {
              Runtime.trap("Question with ID " # questionId.toText() # " not found");
            };
            case (?question) {
              if (question.subject != #physics and question.subject != #chemistry) {
                Runtime.trap("Question with ID " # questionId.toText() # " does not match Physics or Chemistry");
              };
            };
          };
        };

        // Validate question IDs and subjects for section 2
        for (questionId in section2QuestionIds.values()) {
          switch (questions.get(questionId)) {
            case (null) {
              Runtime.trap("Question with ID " # questionId.toText() # " not found");
            };
            case (?question) {
              if (question.subject != #maths) {
                Runtime.trap("Question with ID " # questionId.toText() # " does not match Maths");
              };
            };
          };
        };

        // Update test sections with new question IDs
        let updatedTest : FullSyllabusTest = {
          test with
          section1 = {
            test.section1 with
            questionIds = validatedSection1Ids.toArray();
          };
          section2 = {
            test.section2 with
            questionIds = validatedSection2Ids.toArray();
          };
        };

        fullSyllabusTests.add(testId, updatedTest);
      };
    };
  };

  public shared ({ caller }) func startTest(testId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start tests");
    };

    let attemptId = nextTestAttemptId;

    let newAttempt : TestAttempt = {
      attemptId;
      testId;
      userId = caller;
      createdAt = Time.now();
      currentSection = 1;
      section1StartTime = null;
      section2StartTime = null;
      section1SubmittedAt = null;
      section2SubmittedAt = null;
      isCompleted = false;
      section1Answers = [];
      section2Answers = [];
      section1Score = 0;
      section2Score = 0;
    };

    testAttempts.add(attemptId, newAttempt);

    let initialStatus : TestAttemptStatus = {
      section1 = { status = #notStarted; timestamp = Time.now() };
      section2 = { status = #notStarted; timestamp = Time.now() };
      overall = #notStarted;
    };

    // Store the initial section status
    sectionStatuses.add(attemptId, initialStatus);

    nextTestAttemptId += 1;
  };

  public shared ({ caller }) func startSection(attemptId : Nat, sectionNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sections");
    };

    // Check if the test attempt exists
    switch (testAttempts.get(attemptId)) {
      case (null) {
        Runtime.trap("Test attempt not found");
      };
      case (?attempt) {
        // Check if the caller owns the test attempt
        if (caller != attempt.userId) {
          Runtime.trap("Unauthorized: You do not own this test attempt");
        };

        // Validate section number (should be 1 or 2)
        if (sectionNumber < 1 or sectionNumber > 2) {
          Runtime.trap("Invalid section number");
        };

        let startTime = Time.now();

        let updatedAttempt : TestAttempt = {
          attempt with
          currentSection = sectionNumber;
          section1StartTime = if (sectionNumber == 1) { ?startTime } else {
            attempt.section1StartTime;
          };
          section2StartTime = if (sectionNumber == 2) { ?startTime } else {
            attempt.section2StartTime;
          };
        };

        testAttempts.add(attemptId, updatedAttempt);
      };
    };
  };

  public shared ({ caller }) func submitSection(attemptId : Nat, sectionNumber : Nat, answers : [Answer]) : async {
    score : Nat;
    correctAnswers : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit sections");
    };

    switch (testAttempts.get(attemptId)) {
      case (null) {
        Runtime.trap("Test attempt not found");
      };
      case (?attempt) {
        // Check if the caller owns the test attempt
        if (caller != attempt.userId) {
          Runtime.trap("Unauthorized: You do not own this test attempt");
        };

        // Validate section number (should be 1 or 2)
        if (sectionNumber < 1 or sectionNumber > 2) {
          Runtime.trap("Invalid section number");
        };

        // Check if section has started
        if ((sectionNumber == 1 and attempt.section1StartTime == null) or (sectionNumber == 2 and attempt.section2StartTime == null)) {
          Runtime.trap("Section has not started yet");
        };

        // Check if section is already submitted
        if ((sectionNumber == 1 and attempt.section1SubmittedAt != null) or (sectionNumber == 2 and attempt.section2SubmittedAt != null)) {
          Runtime.trap("Section has already been submitted");
        };

        // Validate time constraints (within 90 minutes)
        let sectionStartTime = if (sectionNumber == 1) { attempt.section1StartTime } else {
          attempt.section2StartTime;
        };

        let currentTime = Time.now();
        let timeLimit = 90 * 60 * 1000000000; // 90 minutes in nanoseconds

        switch (sectionStartTime) {
          case (null) {
            Runtime.trap("Section has not started yet");
          };
          case (?startTime) {
            if (currentTime - startTime > timeLimit) {
              Runtime.trap("Section submission time exceeded");
            };
          };
        };

        // Score calculation
        let questionIds = if (sectionNumber == 1) {
          switch (fullSyllabusTests.get(attempt.testId)) {
            case (null) {
              Runtime.trap("Test not found");
            };
            case (?test) {
              test.section1.questionIds;
            };
          };
        } else {
          switch (fullSyllabusTests.get(attempt.testId)) {
            case (null) {
              Runtime.trap("Test not found");
            };
            case (?test) {
              test.section2.questionIds;
            };
          };
        };

        var score = 0;
        var correctAnswers = 0;

        for (answer in answers.values()) {
          switch (questions.get(answer.questionId)) {
            case (null) {};
            case (?question) {
              if (answer.selectedOptionIndex == question.correctAnswerIndex) {
                correctAnswers += 1;
                score += if (sectionNumber == 1) { 1 } else { 2 }; // Section 1 = 1 mark, Section 2 = 2 marks
              };
            };
          };
        };

        // Update test attempt with section results
        let updatedAttempt : TestAttempt = {
          attempt with
          currentSection = sectionNumber;
          section1SubmittedAt = if (sectionNumber == 1) { ?currentTime } else {
            attempt.section1SubmittedAt;
          };
          section2SubmittedAt = if (sectionNumber == 2) { ?currentTime } else {
            attempt.section2SubmittedAt;
          };
          isCompleted = (sectionNumber == 2);
          section1Score = if (sectionNumber == 1) { score } else { attempt.section1Score };
          section2Score = if (sectionNumber == 2) { score } else { attempt.section2Score };
          section1Answers = if (sectionNumber == 1) { answers } else {
            attempt.section1Answers;
          };
          section2Answers = if (sectionNumber == 2) { answers } else {
            attempt.section2Answers;
          };
        };

        testAttempts.add(attemptId, updatedAttempt);

        {
          score;
          correctAnswers;
        };
      };
    };
  };

  // API Endpoint to Get Test Attempt Details
  public query ({ caller }) func getTestAttempt(attemptId : Nat) : async ?TestAttempt {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access test attempts");
    };

    switch (testAttempts.get(attemptId)) {
      case (null) { null };
      case (?attempt) {
        // Users can only view their own test attempts, admins can view all
        if (caller != attempt.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only view your own test attempts");
        };
        ?attempt;
      };
    };
  };

  // API Endpoint to Get All Test Attempts (For a User)
  public query ({ caller }) func getUserTestAttempts(userId : Principal) : async [TestAttempt] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access test attempts");
    };

    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own test attempts");
    };

    let iter = testAttempts.values();
    let filtered = iter.filter(
      func(testAttempt) {
        testAttempt.userId == userId;
      }
    );
    filtered.toArray();
  };

  // Query current test in progress
  public query ({ caller }) func getCurrentTestId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get current test ID");
    };

    currentTestId;
  };
};
