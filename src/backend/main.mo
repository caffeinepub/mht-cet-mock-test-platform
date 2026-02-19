import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
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
  var nextTestId = 0; // Counter for unique test IDs

  var currentTestId : ?Nat = null;

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
    // Set the currentTestId to the selected test
    currentTestId := ?testId;

    // Additional logic to initialize the test session can be added here
  };

  public query ({ caller }) func getCurrentTestId() : async ?Nat {
    currentTestId;
  };
};
