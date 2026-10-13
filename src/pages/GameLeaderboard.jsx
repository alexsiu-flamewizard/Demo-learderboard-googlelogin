import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { useAuth } from "../contexts/AuthContext";
import { isFirebaseConfigured } from "../firebase";
import { getGameById } from "../services/gameService";
import { getScoresByGame } from "../services/scoreService";

export function GameLeaderboard() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      if (!isFirebaseConfigured) {
        setError("Firebase is not configured yet.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [gameData, scoreData] = await Promise.all([
          getGameById(gameId),
          getScoresByGame(gameId),
        ]);
        if (!cancelled) {
          setGame(gameData);
          setScores(scoreData);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Failed to load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (loading) {
    return <div className="glass-card h-80 animate-pulse rounded-3xl" />;
  }

  return (
    <section className="space-y-6">
      <div>
        <Link
          to={game ? `/game/${game.id}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to game
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold text-white">
          {game?.title || "Leaderboard"}
        </h1>
        <p className="mt-2 text-slate-400">
          Full ranking for this game, sorted by score from highest to lowest. Top 3 show medals.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="glass-card rounded-3xl p-5">
        <LeaderboardTable
          scores={scores}
          currentUserId={user?.uid}
          showMedals
          emptyMessage="No scores submitted for this game yet."
        />
      </div>
    </section>
  );
}
