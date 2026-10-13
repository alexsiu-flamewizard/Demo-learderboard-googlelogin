import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function AccessDenied() {
  return (
    <section className="glass-card mx-auto max-w-xl rounded-3xl px-6 py-16 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
        <ShieldAlert size={28} />
      </span>
      <h1 className="font-display text-3xl font-bold text-white">Access Denied</h1>
      <p className="mt-3 text-slate-400">
        This page is only available to admin users. Sign in with an account that has
        <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-indigo-200">role = admin</code>
        in Firestore.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Back to Home
      </Link>
    </section>
  );
}
