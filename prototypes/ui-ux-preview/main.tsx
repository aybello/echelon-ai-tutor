import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { trpc } from "@/lib/trpc";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import CourseFinder from "@/components/CourseFinder";
import SiteNav from "@/components/SiteNav";
import QuizShell from "@/components/QuizShell";
import MockExamShell from "@/components/MockExamShell";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuizSession } from "@/hooks/useQuizSession";
import StudentDashboard from "@/pages/StudentDashboard";
import OrgDashboard from "@/pages/OrgDashboard";
import ContinuingEducationCourse from "@/pages/ContinuingEducationCourse";
import { course, practiceQuestions, previewResult, resetPreviewCourse } from "./fixtures";
import "@/index.css";
import "./preview.css";
import "./review-fonts.css";
import "./premium-review.css";
import { reviewLogo } from "./review-brand";

// Original brand asset and embedded fonts keep the review file fully offline.
document.documentElement.classList.add("premium-review");
const localizePreviewImages = () => document.querySelectorAll<HTMLImageElement>('img[src^="https://d2xsxph8kpxj0f.cloudfront.net/"]').forEach(image => { image.src = reviewLogo; });
new MutationObserver(localizePreviewImages).observe(document.documentElement,{childList:true,subtree:true});

const queryClient = new QueryClient({defaultOptions:{ queries:{ retry:false } }});
const client = trpc.createClient({links:[() => ({op}) => observable(observer => {
  const timer = setTimeout(() => { try { observer.next({result:{data:previewResult(op.path,op.input)}}); observer.complete(); } catch(error) { observer.error(error as any); } }, 90);
  return () => clearTimeout(timer);
})]});
const questions = practiceQuestions.map(question => ({...question, isCalc:false}));
function PracticePreview() {
  const quiz = useQuizSession({ examType:"class1-water",allQuestions:questions, freeCourse:true,freeTutorPreview:true });
  useEffect(() => { if (!quiz.initialized) quiz.initialize(); }, [quiz.initialized,quiz.initialize]);
  return <QuizShell currentPath="/class1-water" courseLabel="Ontario · Class 1 Water Treatment" courseTitle="Practice quiz" courseSubtitle="Illustrative sample questions for design review"
    {...quiz} onModuleChange={quiz.handleModuleChange} onCalcOnlyToggle={quiz.handleCalcOnlyToggle}
    onSelect={quiz.setSelected} onConfirm={quiz.handleConfirm} onNext={quiz.handleNext} onGoBack={quiz.goBack}
    onConfidenceChange={quiz.setConfidence} onToggleSteps={() => quiz.setShowSteps(show => !show)}
    onTutorOpen={() => quiz.setTutorOpen(true)} onTutorClose={() => quiz.setTutorOpen(false)} onResetSession={quiz.resetSession}
    modules={[{name:"Coagulation & Flocculation"},{name:"Sedimentation"}]}
    moduleOverviews={{"Coagulation & Flocculation":{title:"Coagulation and flocculation",intro:"Use representative jar tests to compare treatment conditions.",keyPoints:[{heading:"Check conditions",body:"Review pH, alkalinity and the plant's response before adjusting dosing."}],examTips:[]}}}
    renderAITutor={close => <aside role="dialog" aria-label="AI Tutor" className="preview-tutor"><h2>AI Tutor</h2><p>A jar test lets you compare treatment conditions using a representative sample. Check pH and alkalinity alongside dose, then verify the result at the plant.</p><button type="button" onClick={close}>Close Tutor</button><small>Illustrative explanation. The live AI service is not called in this preview.</small></aside>}
    headerExtra={<><QuizModeBar currentMode={quiz.quizMode} onModeChange={quiz.handleModeChange} examType="class1-water" onSettingsOpen={() => quiz.setSettingsOpen(true)} missedCount={quiz.missedCount} />{quiz.settingsOpen && <QuizSettingsDrawer totalQuestions={questions.length} onClose={() => quiz.setSettingsOpen(false)} settings={quiz.quizSettings} onApply={quiz.handleSettingsApply} />}</>}
  />;
}
const routes=[ ["/", "Course finder"], ["/class1-water","Practice"], ["/dashboard","Learner dashboard"], ["/team","Manager dashboard"], ["/mock","Mock exam"], [`/continuing-education/${course.key}`,"CEU course"] ];
function Preview() {
  const [path,navigate] = useLocation();
  useEffect(() => {
    const onLink = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a"); if(!target) return;
      const href=target.getAttribute("href"); if(!href || href.startsWith("https:")) return;
      event.preventDefault();
      if(href.includes("-exam") || href.includes("mock")) navigate("/mock");
      else if(href.startsWith("/continuing-education")) navigate(`/continuing-education/${course.key}`);
      else if(href.startsWith("/dashboard")) navigate("/dashboard");
      else if(href.startsWith("/team")) navigate("/team");
      else if(href.includes("?panel=notes")) { navigate("/class1-water?panel=notes"); }
      else if(href === "/" || href === "/account") navigate("/");
      else navigate("/class1-water");
    };
    document.addEventListener("click",onLink); return () => document.removeEventListener("click",onLink);
  },[navigate]);
  const view = path.split("?")[0];
  return <>
    <header className="preview-review-bar"><div><strong>Echelon · Visual direction 02</strong><span>Interactive review · sample data</span></div><nav aria-label="Preview screens">{routes.map(([href,label]) => <button key={href} type="button" aria-pressed={view===href} onClick={() => navigate(href)}>{label}</button>)}</nav></header>
    <ErrorBoundary key={view}>{view === "/" ? <><SiteNav currentPath="/" /><main className="preview-course-surface"><section className="premium-course-hero"><div><p className="workspace-eyebrow"><span className="premium-kicker-line" /> For water & wastewater operators</p><h1>Confidence starts with <em>understanding.</em></h1><p>Make every study session count. Find your certification path, practise with purpose, and understand the reasoning behind each answer.</p><div className="premium-hero-note"><span>YOUR NEXT CHAPTER</span><p>Start with your exam. Build from there.</p></div></div><div className="premium-process-art" aria-hidden="true"><svg viewBox="0 0 420 330" fill="none"><defs><linearGradient id="review-water" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dae8e7"/><stop offset="1" stopColor="#9fbabf"/></linearGradient></defs><path d="M35 236 213 143 394 239 213 333Z" fill="#e6e9e4"/><path d="M35 226 213 133 394 229 213 323Z" fill="#f3f4ef" stroke="#bfcac7"/><g stroke="#d3ddda"><path d="m80 202 180 96M124 180l180 96M168 157l180 96M79 249l180-94M123 273l180-95M167 296l180-95"/></g><path d="m47 210 59-31 62 32 66-34 54 28 61-32" stroke="#a58961" strokeWidth="5" strokeLinejoin="round"/><g stroke="#547b86" strokeWidth="1.5"><path d="M103 112v78c0 23 87 23 87 0v-78" fill="url(#review-water)"/><ellipse cx="146.5" cy="112" rx="43.5" ry="22" fill="#f0f5f1"/><ellipse cx="146.5" cy="143" rx="43.5" ry="22" fill="#83aeb7" fillOpacity=".55"/><path d="M246 142v74c0 22 89 22 89 0v-74" fill="url(#review-water)"/><ellipse cx="290.5" cy="142" rx="44.5" ry="22" fill="#f0f5f1"/><ellipse cx="290.5" cy="171" rx="44.5" ry="22" fill="#83aeb7" fillOpacity=".55"/><path d="m125 108 21-11 22 11-22 11Z" fill="#dfe7e3"/><path d="M146 99v88m-33-1 33 17 33-17m-63-69v66m60-66v66M263 141l28-14 28 14-28 14ZM290 128v83"/></g><path d="m58 132 33-18M334 191l40-21" stroke="#a58961" strokeWidth="5"/><path d="M63 95V53h79M339 116V78h-82" stroke="#8ca29f" strokeDasharray="3 5"/><circle cx="62" cy="95" r="3" fill="#8ca29f"/><circle cx="339" cy="116" r="3" fill="#8ca29f"/><path d="m148 43 7 10-7 10M253 68l-7 10 7 10" stroke="#a58961" strokeWidth="1.5"/></svg><span>SEE THE PROCESS. UNDERSTAND THE WHY.</span></div></section><CourseFinder /></main></>
    :view === "/dashboard" ? <StudentDashboard /> : view === "/team" ? <OrgDashboard />
    :view.startsWith("/continuing-education/") ? <><div className="preview-ceu-tools"><button onClick={() => { resetPreviewCourse(); void queryClient.invalidateQueries(); }}>Preview final exam with completed sample modules</button></div><ContinuingEducationCourse /></>
    :view === "/mock" ? <MockExamShell title="Class 1 Water · Mock exam preview" badge="ONTARIO CLASS 1" examQuestions={10} examDuration={3600} passThreshold={.7} moduleTargets={{"Coagulation & Flocculation":10}} moduleColors={{"Coagulation & Flocculation":{bg:"#eff6ff",color:"#1d4ed8"}}} questionPool={[]} productKey="class1-water" currentPath="/class1-water-exam" practicePath="/class1-water" practiceLabel="Return to practice" freeAccess />
    :<PracticePreview />}</ErrorBoundary>
  </>;
}
createRoot(document.getElementById("root")!).render(<trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}><ThemeProvider defaultTheme="light"><TooltipProvider><Router hook={useHashLocation}><Preview /></Router><Toaster /></TooltipProvider></ThemeProvider></QueryClientProvider></trpc.Provider>);
