import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Process from "./pages/Process";
import Wastewater from "./pages/Wastewater";
import CareerMap from "./pages/CareerMap";
import PumpingSystems from "./pages/PumpingSystems";
import MockExam from "./pages/MockExam";
import ChemCalc from "./pages/ChemCalc";
import Lab from "./pages/Lab";
import Formulas from "./pages/Formulas";
import About from "./pages/About";
import Class1Quiz from "./pages/Class1Quiz";
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
      <Route path={"/mock-exam"} component={MockExam} />
      <Route path={"/chem-calc"} component={ChemCalc} />
      <Route path={"/lab"} component={Lab} />
      <Route path={"/formulas"} component={Formulas} />
      <Route path={"/about"} component={About} />
      <Route path={"/class1"} component={Class1Quiz} />
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
      <Route path={"/formulas-wqa"} component={FormulasWQA} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/purchase-success"} component={PurchaseSuccess} />
      <Route path={"/account"} component={Account} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
