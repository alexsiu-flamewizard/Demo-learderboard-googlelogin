import { Gamepad2, LogIn, LogOut, Shield } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function linkClass({ isActive }) {
  return [
    "rounded-full px-3 py-1.5 text-sm transition",
    isActive
      ? "bg-white/10 text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
  ].join(" ");
}

export function Navbar() {
  const { user, userProfile, isAdmin, loading, authBusy, loginWithGoogle, logout, error } =
    useAuth();

  const displayName = userProfile?.displayName || user?.displayName || "Player";
  const photoURL = userProfile?.photoURL || user?.photoURL || "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
            <Gamepad2 size={20} />
          </span>
          <span>
            <span className="font-display block text-sm font-bold tracking-wide text-white">
              SUPER MARIO
            </span>
            <span className="text-xs text-slate-400">Google Login · Leaderboard</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={14} />
                Admin
              </span>
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-slate-400">Loading...</span>
          ) : user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-semibold">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[140px] truncate text-sm text-slate-200">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                disabled={authBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={authBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              <LogIn size={14} />
              Login
            </button>
          )}
        </div>
      </div>
      {error ? (
        <div className="border-t border-rose-500/20 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </header>
  );
}
