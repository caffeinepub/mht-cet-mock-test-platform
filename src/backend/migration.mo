import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
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
    subject : {
      #physics;
      #chemistry;
      #maths;
    };
    classLevel : {
      #class11th;
      #class12th;
    };
  };

  type TestSection = {
    name : Text;
    durationMinutes : Nat;
    subjects : [{
      #physics;
      #chemistry;
      #maths;
    }];
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

  type TestAttemptStatus = {
    section1 : {
      status : {
        #notStarted;
        #inProgress;
        #submitted;
      };
      timestamp : Int;
    };
    section2 : {
      status : {
        #notStarted;
        #inProgress;
        #submitted;
      };
      timestamp : Int;
    };
    overall : { #notStarted; #inProgress; #completed };
  };

  // Define Old and New Actor Types
  type OldActor = {
    admins : List.List<Principal>;
    questions : Map.Map<Nat, Question>;
    fullSyllabusTests : Map.Map<Nat, FullSyllabusTest>;
    sectionStatuses : Map.Map<Nat, TestAttemptStatus>;
  };

  type NewActor = {
    adminPrincipals : List.List<Principal>;
    questions : Map.Map<Nat, Question>;
    fullSyllabusTests : Map.Map<Nat, FullSyllabusTest>;
    sectionStatuses : Map.Map<Nat, TestAttemptStatus>;
  };

  public func run(old : OldActor) : NewActor {
    { old with adminPrincipals = old.admins };
  };
};
