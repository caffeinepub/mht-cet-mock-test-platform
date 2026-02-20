import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Debug "mo:core/Debug";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  let adminPrincipals = List.empty<Principal>();

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Question Types
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
    explanation : ?Text;
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

  // LeaderboardEntry type
  public type LeaderboardEntry = {
    rank : Nat;
    userName : Text;
    totalScore : Nat;
    totalTimeTaken : Int;
  };

  public type TestAttempt = {
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
    singleSectionStartTime : ?Int;
    singleSectionSubmittedAt : ?Int;
    singleSectionAnswers : [Answer];
    singleSectionScore : Nat;
    totalScore : Nat;
    totalTimeTaken : Int;
    completionTimestamp : Int;
  };

  let testAttempts = Map.empty<Nat, TestAttempt>();
  var nextTestAttemptId = 0;

  let sectionStatuses = Map.empty<Nat, TestAttemptStatus>();

  public type UserRole = { #admin; #student };

  // Registration Result Type for registerAdmin
  public type RegistrationResult = {
    #success : { registeredPrincipal : Principal; timestamp : Int };
    #alreadyRegistered;
    #unauthorized;
    #internalError;
  };

  public shared ({ caller }) func registerAdmin(newAdmin : Principal) : async RegistrationResult {
    let timestamp = Time.now().toText();
    let currentTime = Time.now();

    Debug.print("[" # timestamp # "] === registerAdmin called ===");
    Debug.print("[" # timestamp # "] Caller principal: " # caller.toText());
    Debug.print("[" # timestamp # "] Target principal to register: " # newAdmin.toText());

    // Get current size of admin principals (List version)
    let adminListSize = adminPrincipals.size();
    Debug.print("[" # timestamp # "] adminPrincipals.list size: " # debug_show(adminListSize));

    // If admin principals list is empty (first-time setup)
    if (adminListSize == 0) {
      // Bootstrapping: No admins yet, allow without permission check
      Debug.print("[" # timestamp # "] Admin principals empty - performing initial setup");
      Debug.print("[" # timestamp # "] Skipping permission checks for first admin");

      // Assign admin using existing approach
      let currentRole = AccessControl.getUserRole(accessControlState, newAdmin);
      if (currentRole == #admin) {
        Debug.print("[" # timestamp # "] Target principal is already an admin, returning #alreadyRegistered");
        return #alreadyRegistered;
      };

      AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
      adminPrincipals.add(newAdmin);

      Debug.print("[" # timestamp # "] First admin successfully registered: " # newAdmin.toText());
      Debug.print("[" # timestamp # "] Admin principals entries after registration:");

      for (principal in adminPrincipals.values()) {
        Debug.print("[" # timestamp # "] - " # principal.toText());
      };

      return #success({
        registeredPrincipal = newAdmin;
        timestamp = currentTime;
      });
    };

    // If not first admin registration, perform permission check
    Debug.print("[" # timestamp # "] Checking admin permissions for subsequent registrations");

    let isCallerAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerRole = AccessControl.getUserRole(accessControlState, caller);

    Debug.print("[" # timestamp # "] Caller is admin: " # debug_show(isCallerAdmin));
    Debug.print("[" # timestamp # "] Caller role: " # debug_show(callerRole));

    if (not isCallerAdmin) {
      Debug.print("[" # timestamp # "] AUTHORIZATION FAILED: Caller is not an admin, returning #unauthorized");
      Debug.print("[" # timestamp # "] Rejecting admin registration for: " # newAdmin.toText());
      return #unauthorized;
    };

    // Check if target principal is already an admin
    let currentRole = AccessControl.getUserRole(accessControlState, newAdmin);
    if (currentRole == #admin) {
      Debug.print("[" # timestamp # "] Target principal is already an admin, returning #alreadyRegistered");
      return #alreadyRegistered;
    };

    // Proceed with admin registration for subsequent admins
    AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
    adminPrincipals.add(newAdmin);

    Debug.print("[" # timestamp # "] Admin successfully registered: " # newAdmin.toText());
    Debug.print("[" # timestamp # "] Admin principals size after registration: " # debug_show(adminPrincipals.size()));

    return #success({
      registeredPrincipal = newAdmin;
      timestamp = currentTime;
    });
  };

  // Fixed getUserRole function - allow any caller including anonymous (guests) to query their role
  public query ({ caller }) func getUserRole() : async UserRole {
    // Authorization: Allow all callers including anonymous (guests)
    // No authorization check needed - this is a public endpoint

    // Diagnostic logging - Log caller principal with timestamp
    let timestamp = Time.now().toText();
    Debug.print("[" # timestamp # "] getUserRole called by: " # caller.toText());

    // Directly use AccessControl to determine role
    let role = AccessControl.getUserRole(accessControlState, caller);

    // Diagnostic logging - Log determined role with timestamp
    Debug.print("[" # timestamp # "] getUserRole result for " # caller.toText() # ": " # debug_show(role));

    switch (role) {
      case (#admin) { #admin };
      case (#user) { #student };
      case (#guest) { #student };
    };
  };

  public type TestType = {
    #fullSyllabus;
    #chapterWise;
  };

  public type Test = {
    testId : Nat;
    testName : Text;
    createdAt : Int;
    testType : TestType;
    isActive : Bool;
    marksPerQuestion : ?Nat;
    durationMinutes : ?Nat;
    sectionCount : ?Nat;
    section1 : ?TestSection;
    section2 : ?TestSection;
    questionIds : [Nat];
  };

  let tests = Map.empty<Nat, Test>();

  // New ChapterWiseTestDetails Type
  public type ChapterWiseTestDetails = {
    testName : Text;
    marksPerQuestion : Nat;
    durationMinutes : Nat;
    questions : [Question];
  };

  public shared ({ caller }) func createChapterWiseTest(testName : Text, marksPerQuestion : Nat, durationMinutes : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create chapter-wise tests");
    };

    if (testName == "") {
      Runtime.trap("Test name cannot be empty");
    };

    if (marksPerQuestion == 0) {
      Runtime.trap("Marks per question must be greater than zero");
    };

    if (durationMinutes < 10 or durationMinutes > 180) {
      Runtime.trap("Duration must be between 10 and 180 minutes");
    };

    let testId = nextTestId;
    let newTest : Test = {
      testId;
      testName;
      createdAt = Time.now();
      testType = #chapterWise : TestType;
      isActive = true;
      marksPerQuestion = ?marksPerQuestion;
      durationMinutes = ?durationMinutes;
      sectionCount = ?1;
      section1 = null;
      section2 = null;
      questionIds = [];
    };

    tests.add(testId, newTest);
    nextTestId += 1;

    testId;
  };

  public shared ({ caller }) func assignQuestionsToChapterWiseTest(testId : Nat, questionIds : [Nat]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign questions");
    };

    if (questionIds.size() == 0) {
      Runtime.trap("At least one question must be assigned to the test");
    };

    for (questionId in questionIds.values()) {
      switch (questions.get(questionId)) {
        case (null) {
          Runtime.trap("Question with ID " # questionId.toText() # " not found");
        };
        case (_) {};
      };
    };

    switch (tests.get(testId)) {
      case (null) {
        Runtime.trap("Test with ID " # testId.toText() # " not found");
      };
      case (?test) {
        if (test.testType != #chapterWise) {
          Runtime.trap("Cannot assign questions - Test ID " # testId.toText() # " is not a chapter-based test");
        };

        let updatedTest : Test = {
          test with
          questionIds = questionIds;
        };

        tests.add(testId, updatedTest);
      };
    };
  };

  // New API for fetching chapter-wise test details with full question list
  public query ({ caller }) func getChapterWiseTestById(testId : Nat) : async { #ok : ChapterWiseTestDetails; #testNotFound } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access test details");
    };

    switch (tests.get(testId)) {
      case (null) {
        #testNotFound;
      };
      case (?test) {
        if (test.testType != #chapterWise or not test.isActive) {
          #testNotFound;
        } else {
          // Get full list of questions for the test
          let questionsList = List.empty<Question>();
          for (questionId in test.questionIds.values()) {
            switch (questions.get(questionId)) {
              case (?question) { questionsList.add(question) };
              case (null) {};
            };
          };

          let testDetails : ChapterWiseTestDetails = {
            testName = test.testName;
            marksPerQuestion = switch (test.marksPerQuestion) {
              case (?marks) { marks };
              case (null) { 0 }; // Shouldn't happen due to validation
            };
            durationMinutes = switch (test.durationMinutes) {
              case (?duration) { duration };
              case (null) { 0 }; // Shouldn't happen due to validation
            };
            questions = questionsList.toArray();
          };

          #ok(testDetails);
        };
      };
    };
  };

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
    explanation : ?Text,
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access questions");
    };
    questions.get(id);
  };

  public query ({ caller }) func getQuestionsBySubject(subject : Subject) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access questions");
    };
    let iter = questions.values();
    let filtered = iter.filter(
      func(q) {
        q.subject == subject;
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getQuestionsByClassLevel(classLevel : ClassLevel) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access questions");
    };
    let iter = questions.values();
    let filtered = iter.filter(
      func(q) {
        q.classLevel == classLevel;
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getAllQuestions() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access questions");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access question count");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tests");
    };
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
};
