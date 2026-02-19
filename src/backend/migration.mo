import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldQuestion = {
    id : Nat;
    questionText : ?Text;
    questionImage : ?Text;
    options : [{
      optionText : ?Text;
      optionImage : ?Text;
    }];
    correctAnswerIndex : Nat;
    explanation : Text;
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

  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    questions : Map.Map<Nat, OldQuestion>;
    nextQuestionId : Nat;
  };

  type TestSection = {
    name : Text;
    durationMinutes : Nat;
    subjects : [{ #physics; #chemistry; #maths }];
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

  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    questions : Map.Map<Nat, OldQuestion>;
    nextQuestionId : Nat;
    fullSyllabusTests : Map.Map<Nat, FullSyllabusTest>;
    nextTestId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      fullSyllabusTests = Map.empty<Nat, FullSyllabusTest>();
      nextTestId = 0;
    };
  };
};
