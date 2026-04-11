import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import PhoneCollectionModal from "./components/PhoneCollectionModal";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Process from "./pages/Process";
import Wastewater from "./pages/Wastewater";
import CareerMap from "./pages/CareerMap";
import PumpingSystems from "./pages/PumpingSystems";
import ProcessControl from "./pages/ProcessControl";
import MockExam from "./pages/MockExam";
import ChemCalc from "./pages/ChemCalc";
import MathPractice from "./pages/MathPractice";
import Lab from "./pages/Lab";
import Formulas from "./pages/Formulas";
import About from "./pages/About";

import Class1MockExam from "./pages/Class1MockExam";
import Admin from "@/pages/Admin";
import WQAQuiz from "@/pages/WQAQuiz";
import WQAMockExam from "@/pages/WQAMockExam";
import OITMockExam from "@/pages/OITMockExam";
import OITWastewaterQuiz from "@/pages/OITWastewaterQuiz";
import OITWastewaterMockExam from "@/pages/OITWastewaterMockExam";
import Pricing from "@/pages/Pricing";
import PurchaseSuccess from "@/pages/PurchaseSuccess";
import Class1WaterQuiz from "@/pages/Class1WaterQuiz";
import Class1WaterMockExam from "@/pages/Class1WaterMockExam";
import Class2WaterQuiz from "@/pages/Class2WaterQuiz";
import Class2WaterMockExam from "@/pages/Class2WaterMockExam";
import Class1WastewaterQuiz from "@/pages/Class1WastewaterQuiz";
import Class1WastewaterMockExam from "@/pages/Class1WastewaterMockExam";
import Class2WastewaterQuiz from "@/pages/Class2WastewaterQuiz";
import Class2WastewaterMockExam from "@/pages/Class2WastewaterMockExam";
import Account from "@/pages/Account";
import FormulasWW2 from "@/pages/FormulasWW2";
import Class3WaterQuiz from "@/pages/Class3WaterQuiz";
import Class3WaterMockExam from "@/pages/Class3WaterMockExam";
import FormulasWater3 from "@/pages/FormulasWater3";
import Class3WastewaterQuiz from "@/pages/Class3WastewaterQuiz";
import Class3WastewaterMockExam from "@/pages/Class3WastewaterMockExam";
import FormulasWW3 from "@/pages/FormulasWW3";
import FormulasWQA from "@/pages/FormulasWQA";
import FormulasWW1 from "@/pages/FormulasWW1";
import FormulasWater1 from "@/pages/FormulasWater1";
import FormulasWater2 from "@/pages/FormulasWater2";
import Class4WaterQuiz from "@/pages/Class4WaterQuiz";
import Class4WaterMockExam from "@/pages/Class4WaterMockExam";
import FormulasWater4 from "@/pages/FormulasWater4";
import Class4WastewaterQuiz from "@/pages/Class4WastewaterQuiz";
import Class4WastewaterMockExam from "@/pages/Class4WastewaterMockExam";
import FormulasWW4 from "@/pages/FormulasWW4";
import WpiClass1WaterQuiz from "@/pages/WpiClass1WaterQuiz";
import WpiClass1WaterMockExam from "@/pages/WpiClass1WaterMockExam";
import FormulasWpiClass1 from "@/pages/FormulasWpiClass1";
import WpiClass2WaterQuiz from "@/pages/WpiClass2WaterQuiz";
import WpiClass2WaterMockExam from "@/pages/WpiClass2WaterMockExam";
import WpiLanding from "@/pages/WpiLanding";
import FormulasWpiClass2 from "@/pages/FormulasWpiClass2";
import WpiClass3WaterQuiz from "@/pages/WpiClass3WaterQuiz";
import WpiClass3WaterMockExam from "@/pages/WpiClass3WaterMockExam";
import FormulasWpiClass3 from "@/pages/FormulasWpiClass3";
import WpiClass4WaterQuiz from "@/pages/WpiClass4WaterQuiz";
import WpiClass4WaterMockExam from "@/pages/WpiClass4WaterMockExam";
import FormulasWpiClass4 from "@/pages/FormulasWpiClass4";
import WpiClass1WastewaterQuiz from "@/pages/WpiClass1WastewaterQuiz";
import WpiClass1WastewaterMockExam from "@/pages/WpiClass1WastewaterMockExam";
import FormulasWpiClass1Ww from "@/pages/FormulasWpiClass1Ww";
import WpiClass2WastewaterQuiz from "@/pages/WpiClass2WastewaterQuiz";
import WpiClass2WastewaterMockExam from "@/pages/WpiClass2WastewaterMockExam";
import FormulasWpiClass2Ww from "@/pages/FormulasWpiClass2Ww";
import WpiClass3WastewaterQuiz from "@/pages/WpiClass3WastewaterQuiz";
import WpiClass3WastewaterMockExam from "@/pages/WpiClass3WastewaterMockExam";
import FormulasWpiClass3Ww from "@/pages/FormulasWpiClass3Ww";
import WpiClass4WastewaterQuiz from "@/pages/WpiClass4WastewaterQuiz";
import WpiClass4WastewaterMockExam from "@/pages/WpiClass4WastewaterMockExam";
import FormulasWpiClass4Ww from "@/pages/FormulasWpiClass4Ww";
import PreviewMode from "@/pages/PreviewMode";
import WaterDistributionGuide from "@/pages/WaterDistribution";
import WastewaterCollectionGuide from "@/pages/WastewaterCollection";
// Flashcard pages
import OITWaterFlashcards from "@/pages/OITWaterFlashcards";
import OITWastewaterFlashcards from "@/pages/OITWastewaterFlashcards";
import Class1WaterFlashcards from "@/pages/Class1WaterFlashcards";
import Class1WastewaterFlashcards from "@/pages/Class1WastewaterFlashcards";
import Class2WaterFlashcards from "@/pages/Class2WaterFlashcards";
import Class2WastewaterFlashcards from "@/pages/Class2WastewaterFlashcards";
import Class3WaterFlashcards from "@/pages/Class3WaterFlashcards";
import Class3WastewaterFlashcards from "@/pages/Class3WastewaterFlashcards";
import Class4WaterFlashcards from "@/pages/Class4WaterFlashcards";
import Class4WastewaterFlashcards from "@/pages/Class4WastewaterFlashcards";
import WQAFlashcards from "@/pages/WQAFlashcards";
import WpiClass1WaterFlashcards from "@/pages/WpiClass1WaterFlashcards";
import WpiClass1WastewaterFlashcards from "@/pages/WpiClass1WastewaterFlashcards";
import WpiClass2WaterFlashcards from "@/pages/WpiClass2WaterFlashcards";
import WpiClass2WastewaterFlashcards from "@/pages/WpiClass2WastewaterFlashcards";
import WpiClass3WaterFlashcards from "@/pages/WpiClass3WaterFlashcards";
import WpiClass3WastewaterFlashcards from "@/pages/WpiClass3WastewaterFlashcards";
import WpiClass4WaterFlashcards from "@/pages/WpiClass4WaterFlashcards";
import WpiClass4WastewaterFlashcards from "@/pages/WpiClass4WastewaterFlashcards";
import WpiClass1WaterDistQuiz from "@/pages/WpiClass1WaterDistQuiz";
import WpiClass1WaterDistFlashcards from "@/pages/WpiClass1WaterDistFlashcards";
import WpiClass1WaterDistMockExam from "@/pages/WpiClass1WaterDistMockExam";
import WpiClass2WaterDistQuiz from "@/pages/WpiClass2WaterDistQuiz";
import WpiClass2WaterDistFlashcards from "@/pages/WpiClass2WaterDistFlashcards";
import WpiClass2WaterDistMockExam from "@/pages/WpiClass2WaterDistMockExam";
import WpiClass3WaterDistQuiz from "@/pages/WpiClass3WaterDistQuiz";
import WpiClass3WaterDistFlashcards from "@/pages/WpiClass3WaterDistFlashcards";
import WpiClass3WaterDistMockExam from "@/pages/WpiClass3WaterDistMockExam";
import WpiClass4WaterDistQuiz from "@/pages/WpiClass4WaterDistQuiz";
import WpiClass4WaterDistFlashcards from "@/pages/WpiClass4WaterDistFlashcards";
import WpiClass4WaterDistMockExam from "@/pages/WpiClass4WaterDistMockExam";
import WpiClass1WaterCollQuiz from "@/pages/WpiClass1WaterCollQuiz";
import WpiClass1WaterCollFlashcards from "@/pages/WpiClass1WaterCollFlashcards";
import WpiClass1WaterCollMockExam from "@/pages/WpiClass1WaterCollMockExam";
import WpiClass2WaterCollQuiz from "@/pages/WpiClass2WaterCollQuiz";
import WpiClass2WaterCollFlashcards from "@/pages/WpiClass2WaterCollFlashcards";
import WpiClass2WaterCollMockExam from "@/pages/WpiClass2WaterCollMockExam";
import WpiClass3WaterCollQuiz from "@/pages/WpiClass3WaterCollQuiz";
import WpiClass3WaterCollFlashcards from "@/pages/WpiClass3WaterCollFlashcards";
import WpiClass3WaterCollMockExam from "@/pages/WpiClass3WaterCollMockExam";
import WpiClass4WaterCollQuiz from "@/pages/WpiClass4WaterCollQuiz";
import WpiClass4WaterCollFlashcards from "@/pages/WpiClass4WaterCollFlashcards";
import WpiClass4WaterCollMockExam from "@/pages/WpiClass4WaterCollMockExam";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
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
      {/* WPI dist/coll formula redirects — redirect to parent WPI treatment formula pages until dedicated pages exist */}
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
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
            <Router />
          </div>
          <PhoneGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
