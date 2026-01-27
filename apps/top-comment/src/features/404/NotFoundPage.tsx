import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <h2 className="text-4xl font-bold text-slate-900">Page not found</h2>
      <p className="max-w-md text-slate-600">
        We couldn't find the page you were looking for. Head back to the lobby
        to start or join a game.
      </p>
      <Link
        to="/"
        className="rounded-full bg-brand-primary px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-dark"
      >
        Return home
      </Link>
    </main>
  );
}

export default NotFoundPage;
