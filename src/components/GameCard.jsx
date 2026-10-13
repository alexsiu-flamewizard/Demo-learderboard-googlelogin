import { Play, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export function GameCard({ game }) {
  return (
    <article className="glass-card group overflow-hidden rounded-3xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            No thumbnail
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{game.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
            {game.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/game/${game.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            <Play size={16} />
            Play
          </Link>
          <Link
            to={`/leaderboard/${game.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            <Trophy size={16} />
            Leaderboard
          </Link>
        </div>
      </div>
    </article>
  );
}
