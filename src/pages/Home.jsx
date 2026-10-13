import { Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "../components/GameCard";
import { isFirebaseConfigured } from "../firebase";
import { getActiveGames } from "../services/gameService";

export function Home() {
  const [games, setGames] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      if (!isFirebaseConfigured) {
        setError("Firebase is not configured yet. Copy .env.example to .env and add your project keys.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getActiveGames();
        if (!cancelled) setGames(data);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Failed to load games.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGames();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGames = useMemo(() => {
    const keyword = queryText.trim().toLowerCase();
    if (!keyword) return games;

    return games.filter((game) => {
      const haystack = `${game.title || ""} ${game.description || ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [games, queryText]);

  return (
    <section className="space-y-8">
      <div className="glass-card overflow-hidden rounded-3xl px-6 py-8 sm:px-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
          <Sparkles size={14} />
          Demo platform for Gemini HTML games
        </p>
        <h1 className="font-display mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Play community games. Climb the leaderboard.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Browse active games, jump into an HTML game in the browser, then submit your score.
          You can look around without signing in.
        </p>

        <label className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search games by title or description"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass-card h-72 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : filteredGames.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-3xl px-6 py-16 text-center text-slate-400">
          {queryText.trim()
            ? "No games match that search."
            : "No active games yet. An admin can add the first one from /admin."}
        </div>
      )}
    </section>
  );
}
