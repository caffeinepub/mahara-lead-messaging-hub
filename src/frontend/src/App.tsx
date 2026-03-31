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
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ComposePage from "./pages/Compose";
import DashboardPage from "./pages/Dashboard";
import LeadsPage from "./pages/Leads";
import LoginPage from "./pages/Login";
import SentHistoryPage from "./pages/SentHistory";
import TemplatesPage from "./pages/Templates";

// Root route with auth guard
const rootRoute = createRootRoute({
  component: Root,
});

function Root() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  leadsRoute,
  composeRoute,
  templatesRoute,
  sentRoute,
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
