import { createBrowserRouter, redirect } from "react-router-dom";
import { AppProviders } from "./AppProviders";
import { RootLayout } from "./RootLayout";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";
import { EntryPage } from "../features/entry/EntryPage";
import { PlayerAuthPage } from "../features/auth/PlayerAuthPage";
import { VenueAuthPage } from "../features/auth/VenueAuthPage";
import { HostPage } from "../features/host/HostPage";
import { JoinPage } from "../features/join/JoinPage";
import { PresenterPage } from "../features/presenter/PresenterPage";
import { NotFoundPage } from "../features/404/NotFoundPage";
import { RoomPage } from "../features/room/components/RoomPage";
import { AnalyticsDashboard } from "../features/analytics/AnalyticsDashboard";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <ErrorBoundary>
          <RootLayout />
        </ErrorBoundary>
      </AppProviders>
    ),
    children: [
      { index: true, element: <EntryPage /> },
      { path: "auth", element: <PlayerAuthPage /> },
      { path: "venue-auth", element: <VenueAuthPage /> },
      { path: "host", element: <HostPage /> },
      { path: "join", element: <JoinPage /> },
      
      // Room route: modal-based RoomPage
      { 
        path: "room/:roomCode", 
        element: <RoomPage />,
        loader: ({ params }) => {
          const roomCode = params.roomCode;
          if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
            throw new Response("Invalid room code format", { status: 400 });
          }
          return { roomCode: roomCode.toUpperCase() };
        }
      },
      
      // Legacy team routes — redirect to room-based equivalents
      { path: "team/:roomCode", loader: ({ params }) => redirect(`/room/${params.roomCode}`) },
      { path: "team", loader: () => redirect("/join") },
      { path: "play", loader: () => redirect("/join") },

      { path: "analytics/:roomCode", element: <AnalyticsDashboard /> },
      { path: "presenter/:sessionId", element: <PresenterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { 
    path: "*", 
    element: (
      <AppProviders>
        <NotFoundPage />
      </AppProviders>
    ),
  },
]);
