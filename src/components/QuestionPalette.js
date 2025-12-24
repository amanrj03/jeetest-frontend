import React from 'react';

const QuestionPalette = ({ sections, currentSection, currentQuestion, answers, onQuestionClick }) => {
  const getQuestionStatus = (questionId) => {
    return answers[questionId]?.status || 'NOT_VISITED';
  };

  const getStatusClass = (status, isCurrentQuestion, hasAnswer) => {
    let baseClass = 'question-number ';
    
    // Check if question is both answered and marked for review
    if (status === 'MARKED_FOR_REVIEW' && hasAnswer) {
      baseClass += 'question-answered-and-marked';
    } else {
      switch (status) {
        case 'NOT_VISITED':
          baseClass += 'question-not-visited';
          break;
        case 'NOT_ANSWERED':
          baseClass += 'question-not-answered';
          break;
        case 'ANSWERED':
          baseClass += 'question-answered';
          break;
        case 'MARKED_FOR_REVIEW':
          baseClass += 'question-marked-review';
          break;
        default:
          baseClass += 'question-not-visited';
      }
    }

    if (isCurrentQuestion) {
      baseClass += ' question-current';
    }

    return baseClass;
  };

  const getStatusCounts = () => {
    const counts = {
      NOT_VISITED: 0,
      NOT_ANSWERED: 0,
      ANSWERED: 0,
      MARKED_FOR_REVIEW: 0,
      ANSWERED_AND_MARKED: 0
    };

    sections.forEach(section => {
      section.questions.forEach(question => {
        const status = getQuestionStatus(question.id);
        const hasAnswer = answers[question.id]?.selectedOption || 
                         (answers[question.id]?.integerAnswer !== null && answers[question.id]?.integerAnswer !== undefined);
        
        // Check if question is both answered and marked for review
        if (status === 'MARKED_FOR_REVIEW' && hasAnswer) {
          counts.ANSWERED_AND_MARKED++;
          counts.ANSWERED++; // Also count as answered
        } else if (status === 'ANSWERED') {
          counts.ANSWERED++;
        } else {
          // Count other statuses normally
          counts[status]++;
        }
      });
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Question Palette</h3>
      
      {/* Status Legend */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium mb-3">Legend:</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="question-number question-not-visited">1</div>
            <span>Not Visited ({statusCounts.NOT_VISITED})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="question-number question-not-answered">2</div>
            <span>Not Answered ({statusCounts.NOT_ANSWERED})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="question-number question-answered">3</div>
            <span>Answered ({statusCounts.ANSWERED})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="question-number question-marked-review">4</div>
            <span>Marked for Review ({statusCounts.MARKED_FOR_REVIEW})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="question-number question-answered-and-marked">5</div>
            <span>Answered & Marked ({statusCounts.ANSWERED_AND_MARKED})</span>
          </div>
        </div>
      </div>

      {/* Current Section Questions */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium mb-3">
          {sections[currentSection]?.name} - Questions
        </h4>
        
        <div className="p-3 bg-white rounded-lg border">
          <div className="grid grid-cols-5 gap-2">
            {sections[currentSection]?.questions.map((question, questionIndex) => {
              const status = getQuestionStatus(question.id);
              const isCurrentQuestion = currentQuestion === questionIndex;
              const hasAnswer = answers[question.id]?.selectedOption || answers[question.id]?.integerAnswer;
              
              return (
                <button
                  key={question.id}
                  onClick={() => onQuestionClick(currentSection, questionIndex)}
                  className={getStatusClass(status, isCurrentQuestion, hasAnswer)}
                  title={`Question ${questionIndex + 1} - ${status.replace('_', ' ')}`}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
};

export default QuestionPalette;