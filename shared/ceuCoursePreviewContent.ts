export interface CeuPreviewQuestion {
  question: string;
  choices: readonly string[];
  correctIndex: number;
  explanation: string;
}

export interface CeuPreviewScenario {
  title: string;
  brief: string;
  prompt: string;
  modelAnswer: string;
}

export interface CeuPreviewModule {
  number: number;
  title: string;
  overview: string;
  learningPoints: readonly string[];
  scenario: CeuPreviewScenario;
  knowledgeCheck: CeuPreviewQuestion;
}

export interface CeuPreviewAssessment {
  title: string;
  instructions: string;
  passingScore: number;
  questions: readonly CeuPreviewQuestion[];
}

export interface CeuCoursePreview {
  courseKey: string;
  courseIntroduction: string;
  learningDisclaimer: string;
  modules: readonly CeuPreviewModule[];
  finalAssessment: CeuPreviewAssessment;
}

export interface CeuCoursePreviewPackage {
  courses: readonly CeuCoursePreview[];
}

export function calculateCeuPreviewScore(
  questions: readonly CeuPreviewQuestion[],
  responses: readonly number[],
) {
  const correct = questions.reduce(
    (total, question, index) => total + (responses[index] === question.correctIndex ? 1 : 0),
    0,
  );
  return {
    correct,
    percentage: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
  };
}
