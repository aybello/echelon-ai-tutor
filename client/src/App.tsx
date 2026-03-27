import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Process from "./pages/Process";
import Wastewater from "./pages/Wastewater";
import CareerMap from "./pages/CareerMap";
import PumpingSystems from "./pages/PumpingSystems";
import MockExam from "./pages/MockExam";
import ChemCalc from "./pages/ChemCalc";
import Lab from "./pages/Lab";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/process"} component={Process} />
      <Route path={"/wastewater"} component={Wastewater} />
      <Route path={"/career"} component={CareerMap} />
      <Route path={"/pumping"} component={PumpingSystems} />
      <Route path={"/mock-exam"} component={MockExam} />
      <Route path={"/chem-calc"} component={ChemCalc} />
      <Route path={"/lab"} component={Lab} />
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
