import { formatScoreDate } from "../services/scoreService";

const medals = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function LeaderboardTable({
  scores = [],
  currentUserId = "",
  limit,
  showMedals = false,
  emptyMessage = "No scores yet. Be the first to play.",
}) {
  const rows = typeof limit === "number" ? scores.slice(0, limit) : scores;

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUserId && entry.userId === currentUserId;
            const medal = showMedals ? medals[rank] : "";

            return (
              <tr
                key={entry.id || `${entry.userId}-${rank}`}
                className={
                  isCurrentUser
                    ? "bg-indigo-500/15 text-white"
                    : "border-t border-white/5 text-slate-200"
                }
              >
                <td className="px-4 py-3 font-semibold">
                  {medal ? `${medal} ${rank}` : rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {entry.userPhotoURL ? (
                      <img
                        src={entry.userPhotoURL}
                        alt={entry.userName || "Player"}
                        className="h-8 w-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs">
                        {(entry.userName || "P").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium">
                      {entry.userName || "Player"}
                      {isCurrentUser ? (
                        <span className="ml-2 text-xs text-indigo-300">you</span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {Number(entry.score)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatScoreDate(entry.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
