import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar } from './Sidebar/Sidebar';
import { Topbar } from './Topbar/Topbar';
import { Toast } from './Toast/Toast';
import { Modals } from './Modals/Modals';

// Pages
import Dashboard from './Dashboard/Dashboard';
import Pipeline from './Pipeline/Pipeline';
import Leads from './Leads/Leads';
import LeadDetail from './LeadDetail/LeadDetail';
import ActivityPage from './Activity/Activity';
import Tasks from './Tasks/Tasks';
import Team from './Team/Team';

function AppContent() {
  const { currentView } = useCRM();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pipeline':
        return <Pipeline />;
      case 'leads':
        return <Leads />;
      case 'detail':
        return <LeadDetail />;
      case 'activity':
        return <ActivityPage />;
      case 'tasks':
        return <Tasks />;
      case 'team':
        return <Team />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          {renderView()}
        </div>
      </div>
      <Toast />
      <Modals />
    </div>
  );
}

export default function App() {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
}
