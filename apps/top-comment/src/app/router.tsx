import { createBrowserRouter } from "react-router-dom";
import { AppProviders } from "./AppProviders";
import { RootLayout } from "./RootLayout";
import { EntryPage } from "../features/entry/EntryPage";
import { PlayerAuthPage } from "../features/auth/PlayerAuthPage";
import { VenueAuthPage } from "../features/auth/VenueAuthPage";
import { HostPage } from "../features/host/HostPage";
import { TeamPage } from "../features/team/TeamPage";
import { JoinPage } from "../features/join/JoinPage";
import { PresenterPage } from "../features/presenter/PresenterPage";
import { NotFoundPage } from "../features/404/NotFoundPage";
import { RoomPage } from "../features/room/components/RoomPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <RootLayout />
      </AppProviders>
    ),
    children: [
      { index: true, element: <EntryPage /> },
      { path: "auth", element: <PlayerAuthPage /> },
      { path: "venue-auth", element: <VenueAuthPage /> },
      { path: "host", element: <HostPage /> },
      { path: "join", element: <JoinPage /> },
      
      // Room route: modal-based RoomPage (new)
      { 
        path: "room/:roomCode", 
        element: <RoomPage />,
        loader: ({ params }) => {
          const roomCode = params.roomCode;
          // Basic validation: 6 characters, alphanumeric
          if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
            throw new Response("Invalid room code format", { status: 400 });
          }
          return { roomCode: roomCode.toUpperCase() };
        }
      },
      
      // Team route: existing TeamPage
      { 
        path: "team/:roomCode", 
        element: <TeamPage />,
        loader: ({ params }) => {
          const roomCode = params.roomCode;
          // Basic validation: 6 characters, alphanumeric
          if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
            throw new Response("Invalid room code format", { status: 400 });
          }
          return { roomCode: roomCode.toUpperCase() };
        }
      },
      
      { path: "play", element: <TeamPage /> },
      { path: "team", element: <TeamPage /> },
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
