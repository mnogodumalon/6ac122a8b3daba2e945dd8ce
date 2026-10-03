import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import HundePage from '@/pages/HundePage';
import KursePage from '@/pages/KursePage';
import AnmeldungenPage from '@/pages/AnmeldungenPage';
import PublicFormHunde from '@/pages/public/PublicForm_Hunde';
import PublicFormKurse from '@/pages/public/PublicForm_Kurse';
import PublicFormAnmeldungen from '@/pages/public/PublicForm_Anmeldungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6ac12295f37991d52a121aee" element={<PublicFormHunde />} />
              <Route path="public/6ac12299b622279a56c520e6" element={<PublicFormKurse />} />
              <Route path="public/6ac122993494b8b90e6ab80d" element={<PublicFormAnmeldungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="hunde" element={<HundePage />} />
                <Route path="kurse" element={<KursePage />} />
                <Route path="anmeldungen" element={<AnmeldungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
