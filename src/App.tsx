import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { IncidentQueue } from './components/IncidentQueue';
import { TacticalMap } from './components/TacticalMap';
import { AllocationPlanPanel } from './components/AllocationPlanPanel';
import { PlanDiffModal } from './components/PlanDiffModal';
import { EquityDrawer } from './components/EquityDrawer';
import { MobileFieldSOSModal } from './components/MobileFieldSOSModal';
import { FleetDrawer } from './components/FleetDrawer';
import { JudgeDemoTour } from './components/JudgeDemoTour';
import { useDisasterStore } from './stores/useDisasterStore';

export const App: React.FC = () => {
  const {
    activePlan,
    approveCurrentPlan,
    runAllocation,
    setEquityDrawerOpen,
    isEquityDrawerOpen,
    isDiffModalOpen,
  } = useDisasterStore();

  // Run initial allocation on startup so dashboard is pre-populated with mathematical recommendations
  useEffect(() => {
    runAllocation();
  }, [runAllocation]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Enter' && activePlan && activePlan.status !== 'APPROVED' && !isDiffModalOpen) {
        approveCurrentPlan();
      } else if (e.key.toLowerCase() === 'e') {
        setEquityDrawerOpen(!isEquityDrawerOpen);
      } else if (e.key.toLowerCase() === 'r') {
        runAllocation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePlan, approveCurrentPlan, runAllocation, isEquityDrawerOpen, setEquityDrawerOpen, isDiffModalOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-content-primary font-sans antialiased overflow-hidden">
      {/* Top Bar Header */}
      <Header />

      {/* Main 3-Pane Tactical Command Cockpit */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Incident Priority Queue */}
        <IncidentQueue />

        {/* Center Pane: Leaflet & Uber H3 Tactical Map */}
        <TacticalMap />

        {/* Right Pane: Explainable Allocation Plan */}
        <AllocationPlanPanel />
      </div>

      {/* Interactive Modals, Drawers & Tour */}
      <PlanDiffModal />
      <EquityDrawer />
      <FleetDrawer />
      <MobileFieldSOSModal />
      <JudgeDemoTour />
    </div>
  );
};

export default App;
