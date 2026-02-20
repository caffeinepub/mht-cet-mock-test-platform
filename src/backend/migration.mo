import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  // Old Actor Types
  type OldOption = {
    optionText : ?Text;
    optionImage : ?Text;
  };

  type OldQuestion = {
    id : Nat;
    questionText : ?Text;
    questionImage : ?Text;
    options : [OldOption];
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
    questions : Map.Map<Nat, OldQuestion>;
  };

  // New Actor Types
  type NewOption = {
    optionText : ?Text;
    optionImage : ?Text;
  };

  type NewQuestion = {
    id : Nat;
    questionText : ?Text;
    questionImage : ?Text;
    options : [NewOption];
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

  type NewActor = {
    questions : Map.Map<Nat, NewQuestion>;
  };

  public func run(old : OldActor) : NewActor {
    let newQuestions = old.questions.map<Nat, OldQuestion, NewQuestion>(
      func(_id, oldQuestion) {
        { oldQuestion with explanation = ?oldQuestion.explanation };
      }
    );
    { questions = newQuestions };
  };
};
