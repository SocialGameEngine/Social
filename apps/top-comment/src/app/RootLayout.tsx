import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-[100svh] bg-transparent text-slate-900">
      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
