// Subject extraction for PCM (Physics, Chemistry, Mathematics)
const extractSubjectName = (sectionName) => {
  if (!sectionName || typeof sectionName !== 'string') {
    return 'Unknown';
  }
  
  const name = sectionName.trim().toLowerCase();
  
  if (name.startsWith('physics')) return 'Physics';
  if (name.startsWith('chemistry')) return 'Chemistry';
  if (name.startsWith('mathematics') || name.startsWith('maths')) return 'Mathematics';
  
  // Fallback to first word
  return sectionName.trim().split(/\s+/)[0];
};

// Group sections by subject
const groupSectionsBySubject = (sections, answers) => {
  const subjectGroups = {};
  
  sections.forEach(section => {
    const subjectName = extractSubjectName(section.name);
    
    if (!subjectGroups[subjectName]) {
      subjectGroups[subjectName] = {
        name: subjectName,
        sections: [],
        questions: [],
        stats: null
      };
    }
    
    subjectGroups[subjectName].sections.push(section);
    subjectGroups[subjectName].questions.push(...section.questions);
  });
  
  // Calculate stats for each subject
  Object.keys(subjectGroups).forEach(subjectName => {
    subjectGroups[subjectName].stats = calculateSubjectStats(
      subjectGroups[subjectName].questions, 
      answers
    );
  });
  
  return subjectGroups;
};

// Calculate subject statistics
const calculateSubjectStats = (questions, answers) => {
  const stats = {
    total: questions.length,
    correct: 0,
    wrong: 0,
    unattempted: 0,
    marks: 0,
    maxMarks: 0,
    totalTime: 0,
    accuracy: 0
  };
  
  questions.forEach(question => {
    const answer = answers.find(a => a.questionId === question.id);
    stats.maxMarks += question.marks;
    
    if (answer) {
      if (answer.isCorrect === true) {
        stats.correct++;
        stats.marks += answer.marksAwarded;
      } else if (answer.isCorrect === false) {
        stats.wrong++;
        stats.marks += answer.marksAwarded; // Can be negative
      } else {
        stats.unattempted++;
      }
      
      if (answer.timeSpent) {
        stats.totalTime += answer.timeSpent;
      }
    } else {
      stats.unattempted++;
    }
  });
  
  const attemptedQuestions = stats.correct + stats.wrong;
  stats.accuracy = attemptedQuestions > 0 ? 
    ((stats.correct / attemptedQuestions) * 100) : 0;
  
  return stats;
};

// Generate question-wise data for line charts
const generateQuestionWiseData = (sections, answers) => {
  const questionData = [];
  let questionIndex = 1;
  
  sections.forEach(section => {
    const subject = extractSubjectName(section.name);
    
    section.questions.forEach(question => {
      const answer = answers.find(a => a.questionId === question.id);
      
      questionData.push({
        questionNumber: questionIndex,
        subject: subject,
        marks: answer?.marksAwarded || 0,
        timeSpent: answer?.timeSpent || 0,
        isCorrect: answer?.isCorrect,
        maxMarks: question.marks
      });
      
      questionIndex++;
    });
  });
  
  return questionData;
};

// Auto-detect multiple subjects
const detectMultipleSubjects = (sections) => {
  const subjects = new Set();
  
  sections.forEach(section => {
    const subject = extractSubjectName(section.name);
    subjects.add(subject);
  });
  
  return subjects.size > 1;
};

export { 
  extractSubjectName, 
  groupSectionsBySubject, 
  calculateSubjectStats, 
  generateQuestionWiseData,
  detectMultipleSubjects 
};