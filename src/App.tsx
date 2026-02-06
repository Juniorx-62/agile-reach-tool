import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Timeline from "./pages/Timeline";
import Import from "./pages/Import";
import Export from "./pages/Export";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ActivateAccount from "./pages/ActivateAccount";
import TicketsDashboard from "./pages/tickets/TicketsDashboard";
import TicketsKanban from "./pages/tickets/TicketsKanban";
import PartnersPage from "./pages/tickets/PartnersPage";
import InternalUsersPage from "./pages/tickets/InternalUsersPage";
import CreateTicketPage from "./pages/tickets/CreateTicketPage";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Internal routes (Kanban Interno)
function InternalRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/team" element={<Team />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/import" element={<Import />} />
        <Route path="/export" element={<Export />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

// Ticket system routes
function TicketRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TicketsDashboard />} />
      <Route path="/kanban" element={<TicketsKanban />} />
      <Route path="/parceiros" element={<PartnersPage />} />
      <Route path="/usuarios" element={<InternalUsersPage />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/ativar-conta" element={<ActivateAccount />} />

              {/* Protected routes - Tickets system */}
              <Route
                path="/tickets/*"
                element={
                  <ProtectedRoute>
                    <TicketRoutes />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes - Internal Kanban */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <InternalRoutes />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
