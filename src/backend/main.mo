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
import Order "mo:core/Order";



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

  // Add new LeaderboardEntry type
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

  public shared ({ caller }) func startTest(testId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start tests");
    };

    let attemptId = nextTestAttemptId;
    let currentTime = Time.now();

    // Check if test exists (either full syllabus or chapter-wise)
    let testExists = switch (fullSyllabusTests.get(testId)) {
      case (?_) { true };
      case (null) {
        switch (tests.get(testId)) {
          case (?_) { true };
          case (null) { false };
        };
      };
    };

    if (not testExists) {
      Runtime.trap("Test not found");
    };

    // Determine test type
    let isChapterWise = switch (tests.get(testId)) {
      case (?test) { test.testType == #chapterWise };
      case (null) { false };
    };

    let newAttempt : TestAttempt = {
      attemptId;
      testId;
      userId = caller;
      createdAt = currentTime;
      currentSection = 1;
      section1StartTime = if (not isChapterWise) { ?currentTime } else { null };
      section2StartTime = null;
      section1SubmittedAt = null;
      section2SubmittedAt = null;
      isCompleted = false;
      section1Answers = [];
      section2Answers = [];
      section1Score = 0;
      section2Score = 0;
      singleSectionStartTime = if (isChapterWise) { ?currentTime } else { null };
      singleSectionSubmittedAt = null;
      singleSectionAnswers = [];
      singleSectionScore = 0;
      totalScore = 0;
      totalTimeTaken = 0;
      completionTimestamp = 0;
    };

    testAttempts.add(attemptId, newAttempt);

    let initialStatus : TestAttemptStatus = {
      section1 = { status = #notStarted; timestamp = currentTime };
      section2 = { status = #notStarted; timestamp = currentTime };
      overall = #notStarted;
    };

    sectionStatuses.add(attemptId, initialStatus);

    nextTestAttemptId += 1;

    attemptId;
  };

  public shared ({ caller }) func startSection(attemptId : Nat, sectionNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sections");
    };

    switch (testAttempts.get(attemptId)) {
      case (null) {
        Runtime.trap("Test attempt not found");
      };
      case (?attempt) {
        if (caller != attempt.userId) {
          Runtime.trap("Unauthorized: You do not own this test attempt");
        };

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
        if (caller != attempt.userId) {
          Runtime.trap("Unauthorized: You do not own this test attempt");
        };

        // Check if this is a chapter-wise test (sectionNumber = 0)
        let isChapterWise = (sectionNumber == 0);

        if (not isChapterWise) {
          if (sectionNumber < 1 or sectionNumber > 2) {
            Runtime.trap("Invalid section number");
          };

          if ((sectionNumber == 1 and attempt.section1StartTime == null) or (sectionNumber == 2 and attempt.section2StartTime == null)) {
            Runtime.trap("Section has not started yet");
          };

          if ((sectionNumber == 1 and attempt.section1SubmittedAt != null) or (sectionNumber == 2 and attempt.section2SubmittedAt != null)) {
            Runtime.trap("Section has already been submitted");
          };

          let sectionStartTime = if (sectionNumber == 1) { attempt.section1StartTime } else {
            attempt.section2StartTime;
          };

          let currentTime = Time.now();
          let timeLimit = 90 * 60 * 1000000000;

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

          var score = 0;
          var correctAnswers = 0;

          for (answer in answers.values()) {
            switch (questions.get(answer.questionId)) {
              case (null) {};
              case (?question) {
                if (answer.selectedOptionIndex == question.correctAnswerIndex) {
                  correctAnswers += 1;
                  score += if (sectionNumber == 1) { 1 } else { 2 };
                };
              };
            };
          };

          var totalScore = attempt.totalScore;
          var totalTimeTaken = attempt.totalTimeTaken;
          var completionTimestamp = attempt.completionTimestamp;

          let isCompleted = (sectionNumber == 2);
          if (isCompleted) {
            let section1Score = if (sectionNumber == 1) { score } else { attempt.section1Score };
            let section2Score = if (sectionNumber == 2) { score } else { attempt.section2Score };

            let section1Time = switch (attempt.section1StartTime, attempt.section1SubmittedAt) {
              case (?start, ?end) { end - start };
              case (_) { 0 };
            };

            let section2Time = switch (attempt.section2StartTime, ?currentTime) {
              case (?start, ?end) { end - start };
              case (_) { 0 };
            };

            totalScore := section1Score + section2Score;
            totalTimeTaken := section1Time + section2Time;
            completionTimestamp := currentTime;
          };

          let updatedAttempt : TestAttempt = {
            attempt with
            currentSection = sectionNumber;
            section1SubmittedAt = if (sectionNumber == 1) { ?currentTime } else {
              attempt.section1SubmittedAt;
            };
            section2SubmittedAt = if (sectionNumber == 2) { ?currentTime } else {
              attempt.section2SubmittedAt;
            };
            isCompleted;
            section1Score = if (sectionNumber == 1) { score } else { attempt.section1Score };
            section2Score = if (sectionNumber == 2) { score } else { attempt.section2Score };
            section1Answers = if (sectionNumber == 1) { answers } else {
              attempt.section1Answers;
            };
            section2Answers = if (sectionNumber == 2) { answers } else {
              attempt.section2Answers;
            };
            totalScore;
            totalTimeTaken;
            completionTimestamp;
          };

          testAttempts.add(attemptId, updatedAttempt);

          return {
            score;
            correctAnswers;
          };
        } else {
          if (attempt.singleSectionStartTime == null) {
            Runtime.trap("Chapter-wise test section has not started yet");
          };

          if (attempt.singleSectionSubmittedAt != null) {
            Runtime.trap("Chapter-wise test section has already been submitted");
          };

          switch (tests.get(attempt.testId)) {
            case (null) {
              Runtime.trap("Test configuration not found");
            };
            case (?test) {
              if (test.testType != #chapterWise) {
                Runtime.trap("Test is not a chapter-wise test");
              };

              let currentTime = Time.now();

              let customDuration = switch (test.durationMinutes) {
                case (?duration) { duration };
                case (null) { Runtime.trap("Test duration not configured") };
              };

              let timeLimit = customDuration * 60 * 1000000000;

              switch (attempt.singleSectionStartTime) {
                case (null) {
                  Runtime.trap("Section has not started yet");
                };
                case (?startTime) {
                  if (currentTime - startTime > timeLimit) {
                    Runtime.trap("Section submission time exceeded");
                  };
                };
              };

              let customMarksPerQuestion = switch (test.marksPerQuestion) {
                case (?marks) { marks };
                case (null) { Runtime.trap("Marks per question not configured") };
              };

              var score = 0;
              var correctAnswers = 0;

              for (answer in answers.values()) {
                switch (questions.get(answer.questionId)) {
                  case (null) {};
                  case (?question) {
                    if (answer.selectedOptionIndex == question.correctAnswerIndex) {
                      correctAnswers += 1;
                      score += customMarksPerQuestion;
                    };
                  };
                };
              };

              let totalTimeTaken = switch (attempt.singleSectionStartTime) {
                case (?startTime) { currentTime - startTime };
                case (null) { 0 };
              };

              let updatedAttempt : TestAttempt = {
                attempt with
                singleSectionSubmittedAt = ?currentTime;
                singleSectionAnswers = answers;
                singleSectionScore = score;
                isCompleted = true;
                totalScore = score;
                totalTimeTaken;
                completionTimestamp = currentTime;
              };

              testAttempts.add(attemptId, updatedAttempt);

              return {
                score;
                correctAnswers;
              };
            };
          };
        };
      };
    };
  };

  // New getLeaderboard function
  public query ({ caller }) func getLeaderboard(testId : Nat) : async [LeaderboardEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access leaderboard");
    };

    let completedAttemptsList = List.empty<TestAttempt>();

    for (attempt in testAttempts.values()) {
      if (
        attempt.testId == testId and
        attempt.isCompleted and
        (
          (attempt.section1Score > 0 or attempt.section2Score > 0) or
          attempt.singleSectionScore > 0 or
          attempt.totalScore > 0
        )
      ) {
        completedAttemptsList.add(attempt);
      };
    };

    let completedAttempts = completedAttemptsList.toArray();

    let entriesList = List.empty<LeaderboardEntry>();

    for (attempt in completedAttempts.values()) {
      let userName = switch (userProfiles.get(attempt.userId)) {
        case (null) { "Student" };
        case (?profile) { profile.name };
      };

      let totalScore = if (attempt.totalScore > 0) {
        attempt.totalScore;
      } else if (attempt.section1Score > 0 or attempt.section2Score > 0) {
        attempt.section1Score + attempt.section2Score;
      } else {
        attempt.singleSectionScore;
      };

      entriesList.add({
        rank = 0;
        userName;
        totalScore;
        totalTimeTaken = attempt.totalTimeTaken;
      });
    };

    let compareLeaderboardEntry = func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
      if (a.totalScore > b.totalScore) {
        #less;
      } else if (a.totalScore < b.totalScore) {
        #greater;
      } else {
        if (a.totalTimeTaken < b.totalTimeTaken) {
          #less;
        } else if (a.totalTimeTaken > b.totalTimeTaken) {
          #greater;
        } else {
          #equal;
        };
      };
    };

    var entries = entriesList.toArray();
    entries := entries.sort(
      compareLeaderboardEntry
    );

    let topEntries = if (entries.size() > 10) {
      entries.sliceToArray(0, 10);
    } else {
      entries;
    };

    // Convert topEntries to List for rank assignment
    let topEntriesList = List.fromArray<LeaderboardEntry>(topEntries);

    // Manually assign ranks using a for loop
    let rankedEntriesList = List.empty<LeaderboardEntry>();
    var currentRank = 1;

    for (entry in topEntriesList.values()) {
      rankedEntriesList.add({
        entry with
        rank = currentRank;
      });
      currentRank += 1;
    };

    // Convert back to array for output
    rankedEntriesList.toArray();
  };

  public query ({ caller }) func getTestAttempt(attemptId : Nat) : async ?TestAttempt {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access test attempts");
    };

    switch (testAttempts.get(attemptId)) {
      case (null) { null };
      case (?attempt) {
        if (caller != attempt.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only view your own test attempts");
        };
        ?attempt;
      };
    };
  };

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

  public query ({ caller }) func getCurrentTestId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get current test ID");
    };

    currentTestId;
  };
};
