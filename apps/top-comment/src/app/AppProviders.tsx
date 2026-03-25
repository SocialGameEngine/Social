import { useMemo } from "react";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "../shared/providers/AuthProvider";
import { ToastProvider, Toaster } from "@social/ui";
import { ThemeProvider } from "../shared/providers/ThemeProvider";
import { CurrentPhaseProvider } from "../shared/providers/CurrentPhaseContext";
import { TTSProvider } from "../shared/providers/TTSProvider";

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
  // Auth loads in background - no need to block UI
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
