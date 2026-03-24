import { useMemo } from "react";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "../shared/providers/AuthProvider";
import { ToastProvider, Toaster } from "@social/ui";
import { ThemeProvider } from "../shared/providers/ThemeProvider";
import { CurrentPhaseProvider } from "../shared/providers/CurrentPhaseContext";
import { TTSProvider } from "../shared/providers/TTSProvider";
import { useAuth } from "../shared/providers/AuthContext";
import { BootScreen } from "../shared/components/BootScreen";
import type { BootState } from "../hooks/async/types";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

function AppBootGuard({ children }: PropsWithChildren) {
  const { loading, venueAccountLoading, user } = useAuth();

  const getBootState = (): BootState => {
    if (loading) {
      return { status: "auth_resolving", error: null };
    }
    if (user && venueAccountLoading) {
      return { status: "venue_loading", error: null };
    }
    return { status: "ready", error: null };
  };

  const bootState = getBootState();

  if (bootState.status !== "ready") {
    return <BootScreen state={bootState} />;
  }

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppBootGuard>
            <CurrentPhaseProvider>
              <TTSProvider>
                <ToastProvider>
                  {children}
                  <Toaster />
                </ToastProvider>
              </TTSProvider>
            </CurrentPhaseProvider>
          </AppBootGuard>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default AppProviders;
