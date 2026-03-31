import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { AuthContext, useAuthState } from "./hooks/useAuth";
import ComposePage from "./pages/Compose";
import DashboardPage from "./pages/Dashboard";
import LeadsPage from "./pages/Leads";
import LoginPage from "./pages/Login";
import SentHistoryPage from "./pages/SentHistory";
import SettingsPage from "./pages/Settings";
import TemplatesPage from "./pages/Templates";

// Root route with auth guard
const rootRoute = createRootRoute({
  component: Root,
});

function Root() {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      {auth.isAuthenticated ? (
        <Layout>
          <Outlet />
        </Layout>
      ) : (
        <LoginPage />
      )}
    </AuthContext.Provider>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leads",
  component: LeadsPage,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compose",
  validateSearch: (search: Record<string, unknown>) => ({
    leadIds: (search.leadIds as string | undefined) ?? "",
    templateId: (search.templateId as string | undefined) ?? "",
  }),
  component: ComposePage,
});

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/templates",
  component: TemplatesPage,
});

const sentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sent",
  component: SentHistoryPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  leadsRoute,
  composeRoute,
  templatesRoute,
  sentRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
