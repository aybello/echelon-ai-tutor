/** Fictional preview fixtures only. No customer records, database, email or payments. */
import curriculum from "../../server/ceu/courses/ceu-sampling-data-quality.json" with { type: "json" };
import { ceuModuleSlideCount } from "../../shared/ceuSlides";
import type { CeuCurriculum, CeuLearningRecord } from "../../shared/ceuLearning";
export const course = curriculum as CeuCurriculum;
const now = "2026-10-01T18:00:00.000Z";
export const practiceQuestions = [
  { id: 1, module: "Coagulation & Flocculation", difficulty: "medium", question: "Raw-water turbidity rises after a storm. What is the most useful first step before changing the coagulant dose?", options: ["Double the existing dose immediately", "Run jar tests using a representative sample of the changed water", "Reduce the flocculation time by half", "Stop checking the settled-water turbidity"], correctIndex: 1, explanation: "Jar tests help compare doses under the changed raw-water conditions. Confirm sample representativeness, pH and alkalinity, then monitor the plant response before making further adjustments." },
  { id: 2, module: "Sedimentation", difficulty: "medium", question: "A clarifier's settled-water turbidity rises while the influent flow remains steady. Which observation helps investigate the change?", options: ["Sludge blanket depth and the condition of the withdrawal system", "The condition of the downstream filter backwash pumps", "The treated-water disinfectant residual", "The storage reservoir level"], correctIndex: 0, explanation: "Check the sludge blanket and withdrawal system alongside floc quality and flow distribution. Accumulated solids or hydraulic changes can affect settled-water quality. This is an illustrative preview question, not an addition to the bank." },
];
export const members = [
  { id: 1, email: "jordan@example.test", name: "Jordan Mercer", status: "assigned", assignedAt: now, revokedAt: null, courseKey: "wpi-class4-wastewater", courseKeys: ["wpi-class4-wastewater"], courseProgress: [{ courseKey: "wpi-class4-wastewater", accuracy: 76, totalAttempts: 184, status: "on_track" }], accuracy: 76, totalAttempts: 184, lastActive: now, examDate: "2026-11-12", operatorStatus: "on_track" },
  { id: 2, email: "lee@example.test", name: "Lee Morgan", status: "assigned", assignedAt: now, revokedAt: null, courseKey: "wpi-class4-water-coll", courseKeys: ["wpi-class4-water-coll"], courseProgress: [{ courseKey: "wpi-class4-water-coll", accuracy: null, totalAttempts: 0, status: "not_started" }], accuracy: null, totalAttempts: 0, lastActive: null, examDate: null, operatorStatus: "not_started" },
];
let record: CeuLearningRecord = {
  revision: 1, courseVersion: course.version, startedAt: now, updatedAt: now,
  currentModule: course.modules[0].id, learnerName: "Jordan Mercer", operatorNumber: "DEMO-001",
  modules: Object.fromEntries(course.modules.map((module,index) => [module.id, { draft: "", checks: {}, exerciseSeed: `demo-${index}`, exerciseAttempts: [], activeSeconds: 0, slideIndex: 0, resumeSlideIndex: 0 }])),
  dailySeconds: {}, attempts: [], audit: [],
};
const clone = <T,>(data: T): T => structuredClone(data);
export function previewResult(path: string, input: any): any {
  switch(path) {
    case "auth.me": return { id: 1, name: "Jordan Mercer", email: "jordan@example.test", role: window.location.hash.startsWith("#/admin") ? "admin" : "user", openId: "preview" };
    case "dashboardAuth.me": return { email: "jordan@example.test" };
    case "access.auditMyEntitlements": return { isManager:false, accessibleCourses:[] };
    case "stripe.getMyPurchases": return { purchases:[], unlockedExamTypes:[] };
    case "stripe.getMySubscriptions": return { subscriptions:[], unlockedExamTypes:[] };
    case "flashcard.getProgress": return { knownIds:[], totalCards:practiceQuestions.length };
    case "flashcard.getAllProgress": return { progress:{} };
    case "flashcard.updateProgress": return { success:true, knownIds:input.changes.filter((change: any) => change.known).map((change: any) => change.id) };
    case "admin.stats": return { totalRevenueCAD:1980, purchaseCount:20, subscriptionCount:0, trialCount:12, feedbackCount:8, avgRating:4.8 };
    case "admin.getCeuKpis": return { enrollments:0, learningStarted:0, modulesCompleted:0, finalStarted:0, finalSubmitted:0, retries:0, completed:0, certificatesViewed:0, evaluations:0, averageRating:null };
    case "admin.getProductKpis": return {
      generatedAt:now, periodDays:30,
      funnel:{marketingPageViews:300, productSelections:50, buyerPathSelections:60, checkoutStarts:30, checkoutCompletions:20, diagnosticCompletions:10, mockExamCompletions:8},
      engagement:{weeklyActiveLearners:12, sevenDayReturnRate:60, sevenDayReturnCohort:10, sevenDayReturners:6, thirtyDayReturnRate:50, thirtyDayReturnCohort:8, thirtyDayReturners:4, recordedStudySessionCompletions:30, recordedStudySessionStarts:35, trainingRecordsAttested:0, trainingHoursExports:0, medianMinutesToFirstQuiz:4, quizImprovementPercentagePoints:5, quizImprovementSampleSize:3},
      commercial:{learningActivationRate:80, learningActivated:8, accessCohortSize:10, quizCompletionRate:80, quizCompleters:8, quizStarterCohortSize:10, pricingToCheckoutRate:20, attributedCheckouts:10, pricingCohortSize:50, refundRate:0, renewals:0, cancellations:0},
      teams:{assignedSeats:2, totalSeats:5, utilizationRate:40, allAccess:{assignedSeats:2,totalSeats:5}, coursePass:{allocatedLicences:0,totalLicences:0,activatedLicences:0}},
      outcomes:{passRate:null, passed:0, failed:0, averageReadinessPassed:null, averageReadinessFailed:null},
    };
    case "admin.getPurchases": case "admin.getSubscriptions": case "admin.getTrialEmails": case "admin.getWaitlist": case "admin.getErrorReports": case "admin.getScoreHistory": case "admin.getFeedback": case "admin.listOrganizations": case "admin.getCustomerRecoveryEvidence": return [];
    case "admin.getDataExplorerCatalog": return {datasets:[]};
    case "admin.getDataExplorerPage": return {rows:[], total:0, columns:[], page:1, pageSize:50};
    case "stripe.checkAccess": return { hasAccess: true };
    case "stripe.getCommercialAvailability": return { products: [
      { key: "class1-water", questionCount: 500 },
      { key: "class1-wastewater", questionCount: 800 },
    ] };
    case "stripe.getMySubscriptionsForEmailSession": return { subscriptions: [] };
    case "dashboard.overview": return { totalAttempts: 184, totalSessions: 9, overallAccuracy: 76, currentStreak: 3 };
    case "dashboard.studyFocus": return { courseKey: "class1-water", courseLabel: "Class 1 Water Treatment", quizPath: "/class1-water", mockExamPath: "/class1-water-exam" };
    case "activation.status": return { status: "completed", course: { courseKey: "class1-water" }, profile: { weeklyQuestionGoal: 60 } };
    case "dashboard.studyPlan": return { recommendations: [{ type: "weak_topic", title: "Review coagulation, then practise", description: "A short session on your focus topic is a useful next step.", action: "Continue studying", actionHref: "/class1-water?topic=Coagulation%20%26%20Flocculation" }], totalMissed: 12, totalBookmarked: 4, totalLowConf: 0 };
    case "dashboard.topicAccuracy": return { topics: [{ name: "Coagulation & Flocculation", accuracy: 58, total: 24, correct: 14, status: "weak" }] };
    case "dashboard.dailyActivity": case "dashboard.courseBreakdown": case "dashboard.recentSessions": case "dashboard.aiSessionHistory": return [];
    case "dashboard.difficultyBreakdown": return [];
    case "org.getOrgOverview": return { orgId: 1, orgName: "Prairie Utilities · Sample team", province: "western", status: "active", seatsTotal: 5, seatsAssigned: 2, seatsUsedThisTerm: 2, licencesUsedThisTerm: 2, activeThisWeek: 1, avgReadiness: 68, onTrackCount: 1, termStart: "2026-06-01", termEnd: "2027-06-01", billingType: "invoice", stripeSubscriptionId: null, allowedCourseKeys: null };
    case "org.listMembers": return clone(members);
    case "org.getAttention": return { atRisk: [], stalled: [], examSoon: [] };
    case "org.getPassRateSummary": return { total: 0, passed: 0, passRate: 0 };
    case "orgIntel.getOperatorReadiness": return { operators: members.map(member => ({ ...member, memberStatus: member.status, readinessScore: member.totalAttempts ? 68 : 0, weakestTopic: member.totalAttempts ? "Process troubleshooting" : null, recentMockScores: member.totalAttempts ? [{score:73,total:100}] : [], daysUntilExam: null, examRisk: "none", mockExamsCompleted: member.totalAttempts ? 1 : 0 })) };
    case "orgIntel.sendOperatorReminder": return { email: input.email };
    case "orgIntel.exportTeamCSV": return { orgName: "Sample team", csv: "Operator,Answers\nJordan,184\nLee,0" };
    case "teamFlex.listLicences": return [];
    case "teamFlex.getFlexProgress": return [{ licenceId: 101, operatorEmail: "taylor@example.test", courseKey: "wpi-class4-water-coll", status: "active", totalAttempts: 100, accuracy: 73, readinessScore: 58, accessEndsAt: "2027-06-01T18:00:00.000Z" }];
    case "ceu.identity": return { signedIn: true, email: "jordan@example.test" };
    case "ceu.course": return clone({ ...course, modules: course.modules.map(module => ({ ...module, checks: module.checks.map(({correctIndex, explanation, ...question}) => question) })), finalQuestionCount: course.finalAssessment.length, finalAssessment: undefined, alternateFinalAssessment: undefined });
    case "ceu.myRecord": return clone(record);
    case "ceu.assessment": return record.assessmentDraft ? course.finalAssessment.map(({correctIndex,explanation,...question}) => question) : [];
    case "ceu.sampleQuestions": return course.modules.flatMap(module => module.checks).slice(0, 3).map(({correctIndex,explanation,...question}) => question);
    case "ceu.results": { const attempt = record.attempts.at(-1); return attempt ? { ...attempt, review: [] } : null; }
    case "ceu.save": {
      const action = input.action;
      const at = new Date().toISOString();
      record.revision += 1; record.updatedAt = at;
      if (action.moduleId) record.currentModule = action.moduleId;
      if (action.type === "slideProgress") {
        const module = record.modules[action.moduleId];
        module.slideIndex = Math.max(module.slideIndex ?? 0, action.slideIndex); module.resumeSlideIndex = action.slideIndex;
      }
      if (action.type === "completeModule") {
        record.modules[action.moduleId].completedAt = at;
        const index = course.modules.findIndex(module => module.id === action.moduleId);
        record.currentModule = course.modules[index + 1]?.id ?? action.moduleId;
      }
      if (action.type === "check") {
        const question = course.modules.find(module => module.id === action.moduleId)?.checks.find(question => question.id === action.questionId);
        record.modules[action.moduleId].checks[action.questionId] = { selectedIndex: action.choice, correct: action.choice === question?.correctIndex, answeredAt: at };
        return { record: clone(record), feedback: question?.explanation ?? "Sample answer saved." };
      }
      if (action.type === "beginExam") record.assessmentDraft = { attemptId: "demo-exam", answers: course.finalAssessment.map(() => null) };
      if (action.type === "examDraft") record.assessmentDraft = { attemptId: action.attemptId, answers: action.answers, flaggedQuestionIndexes: action.flaggedQuestionIndexes };
      if (action.type === "exam") {
        const score = action.answers.filter((answer: number, index: number) => answer === course.finalAssessment[index].correctIndex).length;
        const passed = score / course.finalAssessment.length >= .8;
        record.attempts.push({ id: action.attemptId, answers: action.answers, score, total: course.finalAssessment.length, passed, at });
        record.assessmentDraft = undefined;
        if(passed) record.completion = { id: "DEMO-CERTIFICATE", at, name: record.learnerName, operatorNumber: record.operatorNumber, courseId: course.key, recordedMinutes: 0, finalScore:score, finalTotal:course.finalAssessment.length, statement: "Non-credit pilot. This sample certificate does not award CEUs or regulatory recognition." };
      }
      record.audit.push({ at, actor: "preview", action: action.type });
      return { record: clone(record) };
    }
    case "exam.startMock": return { sessionId: "demo-mock", token: "sample-only", examType: "class1-water", preview: false, deadline: Date.now()+3600000, duration:3600, questions: Array.from({length:10},(_,index) => ({ id:index+1, module:"Coagulation & Flocculation", question: practiceQuestions[0].question, options:practiceQuestions[0].options })) };
    case "quiz.logAttempt": return { success: true };
    case "quiz.getMissedQuestions": case "quiz.getBookmarkIds": return [];
    default: return null;
  }
}
export function resetPreviewCourse() { record = { ...record, revision: record.revision+1, completion:undefined, assessmentDraft:undefined, attempts: [], modules: Object.fromEntries(course.modules.map((module,index) => [module.id,{ draft:"",checks:{},exerciseSeed:`demo-${index}`,exerciseAttempts:[],activeSeconds:0,slideIndex:ceuModuleSlideCount(module)-1,resumeSlideIndex:0,completedAt:now }])) }; }
