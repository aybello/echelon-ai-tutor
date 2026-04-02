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
import Pricing from "@/pages/Pricing";
import PurchaseSuccess from "@/pages/PurchaseSuccess";
import Class1WaterQuiz from "@/pages/Class1WaterQuiz";
import Class1WaterMockExam from "@/pages/Class1WaterMockExam";
import Class1WastewaterQuiz from "@/pages/Class1WastewaterQuiz";
import Class1WastewaterMockExam from "@/pages/Class1WastewaterMockExam";

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
      <Route path={"/class1-water"} component={Class1WaterQuiz} />
      <Route path={"/class1-water-mock"} component={Class1WaterMockExam} />
      <Route path={"/class1-ww"} component={Class1WastewaterQuiz} />
      <Route path={"/class1-ww-mock"} component={Class1WastewaterMockExam} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/purchase-success"} component={PurchaseSuccess} />
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
