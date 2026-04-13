import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import PhoneCollectionModal from "./components/PhoneCollectionModal";
import { useAuth } from "./_core/hooks/useAuth";
import { lazy, Suspense } from "react";

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────
// Each page is loaded only when the user navigates to it, dramatically reducing
// the initial JS bundle size from ~2MB to ~200KB.

// Core pages (loaded eagerly — visited by almost every user)
import Landing from "./pages/Landing";
import Home from "./pages/Home";

// Tool pages
const Process = lazy(() => import("./pages/Process"));
const Wastewater = lazy(() => import("./pages/Wastewater"));
const CareerMap = lazy(() => import("./pages/CareerMap"));
const PumpingSystems = lazy(() => import("./pages/PumpingSystems"));
const ProcessControl = lazy(() => import("./pages/ProcessControl"));
const MockExam = lazy(() => import("./pages/MockExam"));
const ChemCalc = lazy(() => import("./pages/ChemCalc"));
const MathPractice = lazy(() => import("./pages/MathPractice"));
const Lab = lazy(() => import("./pages/Lab"));
const Formulas = lazy(() => import("./pages/Formulas"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PreviewMode = lazy(() => import("./pages/PreviewMode"));
const WaterDistributionGuide = lazy(() => import("./pages/WaterDistribution"));
const WastewaterCollectionGuide = lazy(() => import("./pages/WastewaterCollection"));

// Admin / account
const Admin = lazy(() => import("./pages/Admin"));
const Account = lazy(() => import("./pages/Account"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const WpiLanding = lazy(() => import("./pages/WpiLanding"));

// Ontario Class mock exams
const Class1MockExam = lazy(() => import("./pages/Class1MockExam"));

// OIT
const WQAQuiz = lazy(() => import("./pages/WQAQuiz"));
const WQAMockExam = lazy(() => import("./pages/WQAMockExam"));
const OITMockExam = lazy(() => import("./pages/OITMockExam"));
const OITWastewaterQuiz = lazy(() => import("./pages/OITWastewaterQuiz"));
const OITWastewaterMockExam = lazy(() => import("./pages/OITWastewaterMockExam"));

// Ontario Class 1
const Class1WaterQuiz = lazy(() => import("./pages/Class1WaterQuiz"));
const Class1WaterMockExam = lazy(() => import("./pages/Class1WaterMockExam"));
const Class1WastewaterQuiz = lazy(() => import("./pages/Class1WastewaterQuiz"));
const Class1WastewaterMockExam = lazy(() => import("./pages/Class1WastewaterMockExam"));

// Ontario Class 2
const Class2WaterQuiz = lazy(() => import("./pages/Class2WaterQuiz"));
const Class2WaterMockExam = lazy(() => import("./pages/Class2WaterMockExam"));
const Class2WastewaterQuiz = lazy(() => import("./pages/Class2WastewaterQuiz"));
const Class2WastewaterMockExam = lazy(() => import("./pages/Class2WastewaterMockExam"));

// Ontario Class 3
const Class3WaterQuiz = lazy(() => import("./pages/Class3WaterQuiz"));
const Class3WaterMockExam = lazy(() => import("./pages/Class3WaterMockExam"));
const Class3WastewaterQuiz = lazy(() => import("./pages/Class3WastewaterQuiz"));
const Class3WastewaterMockExam = lazy(() => import("./pages/Class3WastewaterMockExam"));

// Ontario Class 4
const Class4WaterQuiz = lazy(() => import("./pages/Class4WaterQuiz"));
const Class4WaterMockExam = lazy(() => import("./pages/Class4WaterMockExam"));
const Class4WastewaterQuiz = lazy(() => import("./pages/Class4WastewaterQuiz"));
const Class4WastewaterMockExam = lazy(() => import("./pages/Class4WastewaterMockExam"));

// Formula sheets — Ontario
const FormulasWater1 = lazy(() => import("./pages/FormulasWater1"));
const FormulasWater2 = lazy(() => import("./pages/FormulasWater2"));
const FormulasWater3 = lazy(() => import("./pages/FormulasWater3"));
const FormulasWater4 = lazy(() => import("./pages/FormulasWater4"));
const FormulasWW1 = lazy(() => import("./pages/FormulasWW1"));
const FormulasWW2 = lazy(() => import("./pages/FormulasWW2"));
const FormulasWW3 = lazy(() => import("./pages/FormulasWW3"));
const FormulasWW4 = lazy(() => import("./pages/FormulasWW4"));
const FormulasWQA = lazy(() => import("./pages/FormulasWQA"));

// WPI Class 1
const WpiClass1WaterQuiz = lazy(() => import("./pages/WpiClass1WaterQuiz"));
const WpiClass1WaterMockExam = lazy(() => import("./pages/WpiClass1WaterMockExam"));
const WpiClass1WastewaterQuiz = lazy(() => import("./pages/WpiClass1WastewaterQuiz"));
const WpiClass1WastewaterMockExam = lazy(() => import("./pages/WpiClass1WastewaterMockExam"));
const WpiClass1WaterDistQuiz = lazy(() => import("./pages/WpiClass1WaterDistQuiz"));
const WpiClass1WaterDistMockExam = lazy(() => import("./pages/WpiClass1WaterDistMockExam"));
const WpiClass1WaterCollQuiz = lazy(() => import("./pages/WpiClass1WaterCollQuiz"));
const WpiClass1WaterCollMockExam = lazy(() => import("./pages/WpiClass1WaterCollMockExam"));
const FormulasWpiClass1 = lazy(() => import("./pages/FormulasWpiClass1"));
const FormulasWpiClass1Ww = lazy(() => import("./pages/FormulasWpiClass1Ww"));

// WPI Class 2
const WpiClass2WaterQuiz = lazy(() => import("./pages/WpiClass2WaterQuiz"));
const WpiClass2WaterMockExam = lazy(() => import("./pages/WpiClass2WaterMockExam"));
const WpiClass2WastewaterQuiz = lazy(() => import("./pages/WpiClass2WastewaterQuiz"));
const WpiClass2WastewaterMockExam = lazy(() => import("./pages/WpiClass2WastewaterMockExam"));
const WpiClass2WaterDistQuiz = lazy(() => import("./pages/WpiClass2WaterDistQuiz"));
const WpiClass2WaterDistMockExam = lazy(() => import("./pages/WpiClass2WaterDistMockExam"));
const WpiClass2WaterCollQuiz = lazy(() => import("./pages/WpiClass2WaterCollQuiz"));
const WpiClass2WaterCollMockExam = lazy(() => import("./pages/WpiClass2WaterCollMockExam"));
const FormulasWpiClass2 = lazy(() => import("./pages/FormulasWpiClass2"));
const FormulasWpiClass2Ww = lazy(() => import("./pages/FormulasWpiClass2Ww"));

// WPI Class 3
const WpiClass3WaterQuiz = lazy(() => import("./pages/WpiClass3WaterQuiz"));
const WpiClass3WaterMockExam = lazy(() => import("./pages/WpiClass3WaterMockExam"));
const WpiClass3WastewaterQuiz = lazy(() => import("./pages/WpiClass3WastewaterQuiz"));
const WpiClass3WastewaterMockExam = lazy(() => import("./pages/WpiClass3WastewaterMockExam"));
const WpiClass3WaterDistQuiz = lazy(() => import("./pages/WpiClass3WaterDistQuiz"));
const WpiClass3WaterDistMockExam = lazy(() => import("./pages/WpiClass3WaterDistMockExam"));
const WpiClass3WaterCollQuiz = lazy(() => import("./pages/WpiClass3WaterCollQuiz"));
const WpiClass3WaterCollMockExam = lazy(() => import("./pages/WpiClass3WaterCollMockExam"));
const FormulasWpiClass3 = lazy(() => import("./pages/FormulasWpiClass3"));
const FormulasWpiClass3Ww = lazy(() => import("./pages/FormulasWpiClass3Ww"));

// WPI Class 4
const WpiClass4WaterQuiz = lazy(() => import("./pages/WpiClass4WaterQuiz"));
const WpiClass4WaterMockExam = lazy(() => import("./pages/WpiClass4WaterMockExam"));
const WpiClass4WastewaterQuiz = lazy(() => import("./pages/WpiClass4WastewaterQuiz"));
const WpiClass4WastewaterMockExam = lazy(() => import("./pages/WpiClass4WastewaterMockExam"));
const WpiClass4WaterDistQuiz = lazy(() => import("./pages/WpiClass4WaterDistQuiz"));
const WpiClass4WaterDistMockExam = lazy(() => import("./pages/WpiClass4WaterDistMockExam"));
const WpiClass4WaterCollQuiz = lazy(() => import("./pages/WpiClass4WaterCollQuiz"));
const WpiClass4WaterCollMockExam = lazy(() => import("./pages/WpiClass4WaterCollMockExam"));
const FormulasWpiClass4 = lazy(() => import("./pages/FormulasWpiClass4"));
const FormulasWpiClass4Ww = lazy(() => import("./pages/FormulasWpiClass4Ww"));

// Flashcards
const OITWaterFlashcards = lazy(() => import("./pages/OITWaterFlashcards"));
const OITWastewaterFlashcards = lazy(() => import("./pages/OITWastewaterFlashcards"));
const Class1WaterFlashcards = lazy(() => import("./pages/Class1WaterFlashcards"));
const Class1WastewaterFlashcards = lazy(() => import("./pages/Class1WastewaterFlashcards"));
const Class2WaterFlashcards = lazy(() => import("./pages/Class2WaterFlashcards"));
const Class2WastewaterFlashcards = lazy(() => import("./pages/Class2WastewaterFlashcards"));
const Class3WaterFlashcards = lazy(() => import("./pages/Class3WaterFlashcards"));
const Class3WastewaterFlashcards = lazy(() => import("./pages/Class3WastewaterFlashcards"));
const Class4WaterFlashcards = lazy(() => import("./pages/Class4WaterFlashcards"));
const Class4WastewaterFlashcards = lazy(() => import("./pages/Class4WastewaterFlashcards"));
const WQAFlashcards = lazy(() => import("./pages/WQAFlashcards"));
const WpiClass1WaterFlashcards = lazy(() => import("./pages/WpiClass1WaterFlashcards"));
const WpiClass1WastewaterFlashcards = lazy(() => import("./pages/WpiClass1WastewaterFlashcards"));
const WpiClass2WaterFlashcards = lazy(() => import("./pages/WpiClass2WaterFlashcards"));
const WpiClass2WastewaterFlashcards = lazy(() => import("./pages/WpiClass2WastewaterFlashcards"));
const WpiClass3WaterFlashcards = lazy(() => import("./pages/WpiClass3WaterFlashcards"));
const WpiClass3WastewaterFlashcards = lazy(() => import("./pages/WpiClass3WastewaterFlashcards"));
const WpiClass4WaterFlashcards = lazy(() => import("./pages/WpiClass4WaterFlashcards"));
const WpiClass4WastewaterFlashcards = lazy(() => import("./pages/WpiClass4WastewaterFlashcards"));
const WpiClass1WaterDistFlashcards = lazy(() => import("./pages/WpiClass1WaterDistFlashcards"));
const WpiClass2WaterDistFlashcards = lazy(() => import("./pages/WpiClass2WaterDistFlashcards"));
const WpiClass3WaterDistFlashcards = lazy(() => import("./pages/WpiClass3WaterDistFlashcards"));
const WpiClass4WaterDistFlashcards = lazy(() => import("./pages/WpiClass4WaterDistFlashcards"));
const WpiClass1WaterCollFlashcards = lazy(() => import("./pages/WpiClass1WaterCollFlashcards"));
const WpiClass2WaterCollFlashcards = lazy(() => import("./pages/WpiClass2WaterCollFlashcards"));
const WpiClass3WaterCollFlashcards = lazy(() => import("./pages/WpiClass3WaterCollFlashcards"));
const WpiClass4WaterCollFlashcards = lazy(() => import("./pages/WpiClass4WaterCollFlashcards"));

// ── Page loading fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading…</p>
      </div>
    </div>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Landing} />
        <Route path={"/quiz"} component={Home} />
        <Route path={"/process"} component={Process} />
        <Route path={"/wastewater"} component={Wastewater} />
        <Route path={"/career"} component={CareerMap} />
        <Route path={"/pumping"} component={PumpingSystems} />
        <Route path={"/instrumentation"} component={ProcessControl} />
        <Route path={"/mock-exam"}>{() => { window.location.replace("/oit-mock"); return null; }}</Route>
        <Route path={"/chem-calc"} component={ChemCalc} />
        <Route path={"/math-practice"} component={MathPractice} />
        <Route path={"/lab"} component={Lab} />
        <Route path={"/formulas"} component={Formulas} />
        <Route path={"/about"} component={About} />
        <Route path={"/class1"}>{() => <Redirect to="/class1-water" />}</Route>
        <Route path={"/class1-mock"} component={Class1MockExam} />
        <Route path={"/wqa"} component={WQAQuiz} />
        <Route path={"/wqa-mock"} component={WQAMockExam} />
        <Route path={"/oit-mock"} component={OITMockExam} />
        <Route path={"/oit-ww"} component={OITWastewaterQuiz} />
        <Route path={"/oit-ww-mock"} component={OITWastewaterMockExam} />
        <Route path={"/class1-water"} component={Class1WaterQuiz} />
        <Route path={"/class1-water-mock"} component={Class1WaterMockExam} />
        <Route path={"/class2-water"} component={Class2WaterQuiz} />
        <Route path={"/class2-water-mock"} component={Class2WaterMockExam} />
        <Route path={"/class1-ww"} component={Class1WastewaterQuiz} />
        <Route path={"/class1-ww-mock"} component={Class1WastewaterMockExam} />
        <Route path={"/class2-ww"} component={Class2WastewaterQuiz} />
        <Route path={"/class2-ww-mock"} component={Class2WastewaterMockExam} />
        <Route path={"/formulas-water1"} component={FormulasWater1} />
        <Route path={"/formulas-water2"} component={FormulasWater2} />
        <Route path={"/formulas-ww1"} component={FormulasWW1} />
        <Route path={"/formulas-ww2"} component={FormulasWW2} />
        <Route path={"/class3-water"} component={Class3WaterQuiz} />
        <Route path={"/class3-water-mock"} component={Class3WaterMockExam} />
        <Route path={"/formulas-water3"} component={FormulasWater3} />
        <Route path={"/class4-water"} component={Class4WaterQuiz} />
        <Route path={"/class4-water-mock"} component={Class4WaterMockExam} />
        <Route path={"/formulas-water4"} component={FormulasWater4} />
        <Route path={"/class3-ww"} component={Class3WastewaterQuiz} />
        <Route path={"/class3-ww-mock"} component={Class3WastewaterMockExam} />
        <Route path={"/formulas-ww3"} component={FormulasWW3} />
        <Route path={"/class4-ww"} component={Class4WastewaterQuiz} />
        <Route path={"/class4-ww-mock"} component={Class4WastewaterMockExam} />
        <Route path={"/formulas-ww4"} component={FormulasWW4} />
        <Route path={"/wpi-class1-water"} component={WpiClass1WaterQuiz} />
        <Route path={"/wpi-class1-water-mock"} component={WpiClass1WaterMockExam} />
        <Route path={"/formulas-wpi-class1"} component={FormulasWpiClass1} />
        <Route path={"/wpi-class2-water"} component={WpiClass2WaterQuiz} />
        <Route path={"/wpi-class2-water-mock"} component={WpiClass2WaterMockExam} />
        <Route path={"/wpi"} component={WpiLanding} />
        <Route path={"/formulas-wpi-class2"} component={FormulasWpiClass2} />
        <Route path={"/wpi-class3-water"} component={WpiClass3WaterQuiz} />
        <Route path={"/wpi-class3-water-mock"} component={WpiClass3WaterMockExam} />
        <Route path={"/formulas-wpi-class3"} component={FormulasWpiClass3} />
        <Route path={"/wpi-class4-water"} component={WpiClass4WaterQuiz} />
        <Route path={"/wpi-class4-water-mock"} component={WpiClass4WaterMockExam} />
        <Route path={"/formulas-wpi-class4"} component={FormulasWpiClass4} />
        <Route path={"/wpi-class1-wastewater"} component={WpiClass1WastewaterQuiz} />
        <Route path={"/wpi-class1-wastewater-mock"} component={WpiClass1WastewaterMockExam} />
        <Route path={"/formulas-wpi-class1-ww"} component={FormulasWpiClass1Ww} />
        <Route path={"/wpi-class2-wastewater"} component={WpiClass2WastewaterQuiz} />
        <Route path={"/wpi-class2-wastewater-mock"} component={WpiClass2WastewaterMockExam} />
        <Route path={"/formulas-wpi-class2-ww"} component={FormulasWpiClass2Ww} />
        <Route path={"/wpi-class3-wastewater"} component={WpiClass3WastewaterQuiz} />
        <Route path={"/wpi-class3-wastewater-mock"} component={WpiClass3WastewaterMockExam} />
        <Route path={"/formulas-wpi-class3-ww"} component={FormulasWpiClass3Ww} />
        <Route path={"/wpi-class4-wastewater"} component={WpiClass4WastewaterQuiz} />
        <Route path={"/wpi-class4-wastewater-mock"} component={WpiClass4WastewaterMockExam} />
        <Route path={"/formulas-wpi-class4-ww"} component={FormulasWpiClass4Ww} />
        <Route path={"/formulas-wqa"} component={FormulasWQA} />
        {/* WPI dist/coll formula redirects */}
        <Route path={"/formulas-wpi-class1-dist"}>{() => <Redirect to="/formulas-wpi-class1" />}</Route>
        <Route path={"/formulas-wpi-class2-dist"}>{() => <Redirect to="/formulas-wpi-class2" />}</Route>
        <Route path={"/formulas-wpi-class3-dist"}>{() => <Redirect to="/formulas-wpi-class3" />}</Route>
        <Route path={"/formulas-wpi-class4-dist"}>{() => <Redirect to="/formulas-wpi-class4" />}</Route>
        <Route path={"/formulas-wpi-class1-coll"}>{() => <Redirect to="/formulas-wpi-class1-ww" />}</Route>
        <Route path={"/formulas-wpi-class2-coll"}>{() => <Redirect to="/formulas-wpi-class2-ww" />}</Route>
        <Route path={"/formulas-wpi-class3-coll"}>{() => <Redirect to="/formulas-wpi-class3-ww" />}</Route>
        <Route path={"/formulas-wpi-class4-coll"}>{() => <Redirect to="/formulas-wpi-class4-ww" />}</Route>
        {/* Flashcard routes */}
        <Route path={"/oit-water-flashcards"} component={OITWaterFlashcards} />
        <Route path={"/oit-ww-flashcards"} component={OITWastewaterFlashcards} />
        <Route path={"/class1-water-flashcards"} component={Class1WaterFlashcards} />
        <Route path={"/class1-ww-flashcards"} component={Class1WastewaterFlashcards} />
        <Route path={"/class2-water-flashcards"} component={Class2WaterFlashcards} />
        <Route path={"/class2-ww-flashcards"} component={Class2WastewaterFlashcards} />
        <Route path={"/class3-water-flashcards"} component={Class3WaterFlashcards} />
        <Route path={"/class3-ww-flashcards"} component={Class3WastewaterFlashcards} />
        <Route path={"/class4-water-flashcards"} component={Class4WaterFlashcards} />
        <Route path={"/class4-ww-flashcards"} component={Class4WastewaterFlashcards} />
        <Route path={"/wqa-flashcards"} component={WQAFlashcards} />
        <Route path={"/wpi-class1-water-flashcards"} component={WpiClass1WaterFlashcards} />
        <Route path={"/wpi-class1-wastewater-flashcards"} component={WpiClass1WastewaterFlashcards} />
        <Route path={"/wpi-class2-water-flashcards"} component={WpiClass2WaterFlashcards} />
        <Route path={"/wpi-class2-wastewater-flashcards"} component={WpiClass2WastewaterFlashcards} />
        <Route path={"/wpi-class3-water-flashcards"} component={WpiClass3WaterFlashcards} />
        <Route path={"/wpi-class3-wastewater-flashcards"} component={WpiClass3WastewaterFlashcards} />
        <Route path={"/wpi-class4-water-flashcards"} component={WpiClass4WaterFlashcards} />
        <Route path={"/wpi-class4-wastewater-flashcards"} component={WpiClass4WastewaterFlashcards} />
        {/* WPI Water Distribution routes */}
        <Route path={"/wpi-class1-water-dist"} component={WpiClass1WaterDistQuiz} />
        <Route path={"/wpi-class1-water-dist-flashcards"} component={WpiClass1WaterDistFlashcards} />
        <Route path={"/wpi-class1-water-dist-mock"} component={WpiClass1WaterDistMockExam} />
        <Route path={"/wpi-class2-water-dist"} component={WpiClass2WaterDistQuiz} />
        <Route path={"/wpi-class2-water-dist-flashcards"} component={WpiClass2WaterDistFlashcards} />
        <Route path={"/wpi-class2-water-dist-mock"} component={WpiClass2WaterDistMockExam} />
        <Route path={"/wpi-class3-water-dist"} component={WpiClass3WaterDistQuiz} />
        <Route path={"/wpi-class3-water-dist-flashcards"} component={WpiClass3WaterDistFlashcards} />
        <Route path={"/wpi-class3-water-dist-mock"} component={WpiClass3WaterDistMockExam} />
        <Route path={"/wpi-class4-water-dist"} component={WpiClass4WaterDistQuiz} />
        <Route path={"/wpi-class4-water-dist-flashcards"} component={WpiClass4WaterDistFlashcards} />
        <Route path={"/wpi-class4-water-dist-mock"} component={WpiClass4WaterDistMockExam} />
        <Route path={"/wpi-class1-water-coll"} component={WpiClass1WaterCollQuiz} />
        <Route path={"/wpi-class1-water-coll-flashcards"} component={WpiClass1WaterCollFlashcards} />
        <Route path={"/wpi-class1-water-coll-mock"} component={WpiClass1WaterCollMockExam} />
        <Route path={"/wpi-class2-water-coll"} component={WpiClass2WaterCollQuiz} />
        <Route path={"/wpi-class2-water-coll-flashcards"} component={WpiClass2WaterCollFlashcards} />
        <Route path={"/wpi-class2-water-coll-mock"} component={WpiClass2WaterCollMockExam} />
        <Route path={"/wpi-class3-water-coll"} component={WpiClass3WaterCollQuiz} />
        <Route path={"/wpi-class3-water-coll-flashcards"} component={WpiClass3WaterCollFlashcards} />
        <Route path={"/wpi-class3-water-coll-mock"} component={WpiClass3WaterCollMockExam} />
        <Route path={"/wpi-class4-water-coll"} component={WpiClass4WaterCollQuiz} />
        <Route path={"/wpi-class4-water-coll-flashcards"} component={WpiClass4WaterCollFlashcards} />
        <Route path={"/wpi-class4-water-coll-mock"} component={WpiClass4WaterCollMockExam} />
        <Route path={"/distribution-guide"} component={WaterDistributionGuide} />
        <Route path={"/collection-guide"} component={WastewaterCollectionGuide} />
        <Route path={"/preview"} component={PreviewMode} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/pricing"} component={Pricing} />
        <Route path={"/purchase-success"} component={PurchaseSuccess} />
        <Route path={"/account"} component={Account} />
        <Route path={"/dashboard"} component={StudentDashboard} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/**
 * PhoneGate — renders a mandatory phone collection modal for any authenticated
 * user who hasn't yet provided a phone number. Cannot be dismissed.
 */
function PhoneGate() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Only show after auth is resolved, user is logged in, and phone is missing
  if (loading || !user) return null;
  if ((user as any).phone) return null;

  return (
    <PhoneCollectionModal
      onComplete={() => utils.auth.me.invalidate()}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="page-enter">
            {/* <main> landmark for accessibility — required by WCAG 2.1 */}
            <main>
              <Router />
            </main>
          </div>
          <PhoneGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
