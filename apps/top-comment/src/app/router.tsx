import { createBrowserRouter } from "react-router-dom";
import { AppProviders } from "./AppProviders";
import { RootLayout } from "./RootLayout";
import { EntryPage } from "../features/entry/EntryPage";
import { PlayerAuthPage } from "../features/auth/PlayerAuthPage";
import { VenueAuthPage } from "../features/auth/VenueAuthPage";
import { HostPage } from "../features/host/HostPage";
import { TeamPage } from "../features/team/TeamPage";
import { PresenterPage } from "../features/presenter/PresenterPage";
import { NotFoundPage } from "../features/404/NotFoundPage";

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
      { path: "join", element: <TeamPage /> },
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
