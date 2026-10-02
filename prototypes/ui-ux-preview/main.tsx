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
import CoursePathHero from "@/components/CoursePathHero";
import SiteNav from "@/components/SiteNav";
import QuizShell from "@/components/QuizShell";
import MockExamShell from "@/components/MockExamShell";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuizSession } from "@/hooks/useQuizSession";
import StudentDashboard from "@/pages/StudentDashboard";
import OrgDashboard from "@/pages/OrgDashboard";
import ContinuingEducationCourse from "@/pages/ContinuingEducationCourse";
import Landing from "@/pages/Landing";
import { course, practiceQuestions, previewResult, resetPreviewCourse } from "./fixtures";
import "@/index.css";
import "./preview.css";
import "./review-fonts.css";
import { reviewLogo } from "./review-brand";

// Self-contained review branding; no external image host is required.
const localizePreviewImages = () => document.querySelectorAll<HTMLImageElement>('img[src="/echelon-logo.webp"]').forEach(image => { image.src = reviewLogo; });
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
const routes=[ ["/", "Course finder"], ["/homepage","Homepage"], ["/class1-water","Practice"], ["/dashboard","Learner dashboard"], ["/team","Manager dashboard"], ["/mock","Mock exam"], [`/continuing-education/${course.key}`,"CEU course"] ];
function Preview() {
  const [path,navigate] = useLocation();
  useEffect(() => {
    const onLink = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a"); if(!target) return;
      const rawHref=target.getAttribute("href"); if(!rawHref || rawHref.startsWith("https:")) return;
      const href=rawHref.startsWith("#/") ? rawHref.slice(1) : rawHref;
      event.preventDefault();
      if(href.startsWith("#")) { document.getElementById(href.slice(1))?.scrollIntoView({behavior:"instant"}); return; }
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
    <header className="preview-review-bar"><div><strong>Echelon · Design review</strong><span>Sample data. Changes stay in this preview.</span></div><nav aria-label="Preview screens">{routes.map(([href,label]) => <button key={href} type="button" aria-pressed={view===href} onClick={() => navigate(href)}>{label}</button>)}</nav></header>
    <ErrorBoundary key={view}>{view === "/" ? <div className="marketing-workspace"><SiteNav currentPath="/" /><main className="preview-course-surface"><CoursePathHero /><CourseFinder /></main></div>
    :view === "/homepage" ? <Landing /> :view === "/dashboard" ? <StudentDashboard /> : view === "/team" ? <OrgDashboard />
    :view.startsWith("/continuing-education/") ? <><div className="preview-ceu-tools"><button onClick={() => { resetPreviewCourse(); void queryClient.invalidateQueries(); }}>Preview final exam with completed sample modules</button></div><ContinuingEducationCourse /></>
    :view === "/mock" ? <MockExamShell title="Class 1 Water · Mock exam preview" badge="ONTARIO CLASS 1" examQuestions={10} examDuration={3600} passThreshold={.7} moduleTargets={{"Coagulation & Flocculation":10}} moduleColors={{"Coagulation & Flocculation":{bg:"#eff6ff",color:"#1d4ed8"}}} questionPool={[]} productKey="class1-water" currentPath="/class1-water-exam" practicePath="/class1-water" practiceLabel="Return to practice" freeAccess />
    :<PracticePreview />}</ErrorBoundary>
  </>;
}
createRoot(document.getElementById("root")!).render(<trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}><ThemeProvider defaultTheme="light"><TooltipProvider><Router hook={useHashLocation}><Preview /></Router><Toaster /></TooltipProvider></ThemeProvider></QueryClientProvider></trpc.Provider>);
