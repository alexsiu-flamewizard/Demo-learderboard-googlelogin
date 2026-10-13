import { Send, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { useAuth } from "../contexts/AuthContext";
import { isFirebaseConfigured } from "../firebase";
import { getGameById } from "../services/gameService";
import { getScoresByGame, submitScore } from "../services/scoreService";

export function GameDetail() {
  const { gameId } = useParams();
  const { user, userProfile, loginWithGoogle, authBusy } = useAuth();
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [scores, setScores] = useState([]);
  const [scoreValue, setScoreValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scoreFromGame, setScoreFromGame] = useState(false);

  async function loadPage() {
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
      setGame(gameData);
      setScores(scoreData);
    } catch (loadError) {
      setError(loadError.message || "Failed to load this game.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function postUserToGame() {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "USER_INFO",
        uid: user?.uid || "",
        email: userProfile?.email || user?.email || "",
        displayName: userProfile?.displayName || user?.displayName || "",
      },
      "*"
    );
  }

  useEffect(() => {
    function handleGameMessage(event) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "REQUEST_USER") {
        postUserToGame();
        return;
      }
      if (data.type === "GAME_QUIT") {
        navigate("/");
        return;
      }
      if (data.type !== "GAME_SCORE") return;

      const nextScore = Number(data.score);
      if (!Number.isFinite(nextScore)) return;

      // Demo: fill the form only. Do not auto-submit.
      setScoreValue(String(nextScore));
      setScoreFromGame(true);
      setError("");
      setSuccess("");
    }

    window.addEventListener("message", handleGameMessage);
    return () => window.removeEventListener("message", handleGameMessage);
  }, [user, userProfile, navigate]);

  useEffect(() => {
    postUserToGame();
  }, [user, userProfile, game]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please sign in before submitting a score.");
      return;
    }

    setSubmitting(true);

    try {
      await submitScore({
        userId: user.uid,
        gameId,
        userName: userProfile?.displayName || user.displayName || "Player",
        userPhotoURL: userProfile?.photoURL || user.photoURL || "",
        score: scoreValue,
      });
      setSuccess("Score submitted.");
      setScoreValue("");
      setScoreFromGame(false);
      const latest = await getScoresByGame(gameId);
      setScores(latest);
    } catch (submitError) {
      setError(submitError.message || "Failed to submit score.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="glass-card h-80 animate-pulse rounded-3xl" />;
  }

  if (!game) {
    return (
      <section className="glass-card rounded-3xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-white">
          {error ? "Unable to load game" : "Game not found"}
        </h1>
        <p className="mt-3 text-slate-400">
          {error || "This game may be inactive or does not exist."}
        </p>
        <Link to="/" className="mt-6 inline-flex text-indigo-300 hover:text-indigo-200">
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-indigo-300">Now playing</p>
          <h1 className="font-display mt-1 text-4xl font-bold text-white">{game.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{game.description}</p>
        </div>
        <Link
          to={`/leaderboard/${game.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <Trophy size={16} />
          Full leaderboard
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="glass-card overflow-hidden rounded-3xl">
        {game.htmlFileUrl ? (
          <iframe
            ref={iframeRef}
            src={game.htmlFileUrl}
            title={game.title}
            className="h-[min(80vh,900px)] min-h-[600px] w-full bg-black"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin"
            allow="fullscreen"
            onLoad={postUserToGame}
          />
        ) : (
          <div className="flex min-h-[600px] items-center justify-center text-slate-400">
            This game does not have an HTML file yet.
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-5">
          <h2 className="font-display text-xl font-bold text-white">Submit score</h2>
          <p className="mt-2 text-sm text-slate-400">
            Type a score manually, or let the HTML game send one with
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-indigo-200">postMessage</code>.
            Demo mode will not submit automatically.
          </p>

          {scoreFromGame && user ? (
            <div className="mt-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
              收到遊戲分數，請點擊提交
            </div>
          ) : null}

          {user ? (
            <>
              <label className="mt-5 block text-sm text-slate-300">
                Score
                <input
                  type="number"
                  required
                  value={scoreValue}
                  onChange={(event) => {
                    setScoreValue(event.target.value);
                    setScoreFromGame(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-indigo-400"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={authBusy}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              Login to submit a score
            </button>
          )}
        </form>

        <div className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">Top 10</h2>
            <span className="text-xs text-slate-400">Sorted by score desc</span>
          </div>
          <LeaderboardTable
            scores={scores}
            currentUserId={user?.uid}
            limit={10}
            showMedals
          />
        </div>
      </div>
    </section>
  );
}
