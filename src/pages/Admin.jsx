import { Pencil, Plus, Power, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  createGame,
  deleteGame,
  getAllGames,
  setGameActive,
  updateGame,
} from "../services/gameService";

const emptyForm = {
  title: "",
  description: "",
  isActive: true,
  thumbnailFile: null,
  htmlFile: null,
};

export function Admin() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const editingGame = useMemo(
    () => games.find((game) => game.id === editingId),
    [games, editingId]
  );

  async function loadGames() {
    setLoading(true);
    setError("");

    try {
      const data = await getAllGames();
      setGames(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load games.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function startEdit(game) {
    setEditingId(game.id);
    setForm({
      title: game.title || "",
      description: game.description || "",
      isActive: Boolean(game.isActive),
      thumbnailFile: null,
      htmlFile: null,
    });
    setSuccess("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingId) {
        await updateGame(editingId, {
          title: form.title,
          description: form.description,
          isActive: form.isActive,
          thumbnailFile: form.thumbnailFile,
          htmlFile: form.htmlFile,
          existingThumbnailUrl: editingGame?.thumbnailUrl,
          existingHtmlFileUrl: editingGame?.htmlFileUrl,
        });
        setSuccess("Game updated.");
      } else {
        await createGame({
          title: form.title,
          description: form.description,
          thumbnailFile: form.thumbnailFile,
          htmlFile: form.htmlFile,
          isActive: form.isActive,
          createdBy: user?.uid || "",
        });
        setSuccess("Game created.");
      }

      resetForm();
      await loadGames();
    } catch (saveError) {
      setError(saveError.message || "Failed to save game.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(game) {
    setError("");
    setSuccess("");

    try {
      await setGameActive(game.id, !game.isActive);
      setSuccess(game.isActive ? "Game disabled." : "Game enabled.");
      await loadGames();
    } catch (toggleError) {
      setError(toggleError.message || "Failed to update game status.");
    }
  }

  async function handleDelete(game) {
    const confirmed = window.confirm(`Delete "${game.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteGame(game, game.id);
      if (editingId === game.id) resetForm();
      setSuccess("Game deleted.");
      await loadGames();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete game.");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-indigo-300">Admin dashboard</p>
        <h1 className="font-display mt-1 text-4xl font-bold text-white">Manage games</h1>
        <p className="mt-2 text-slate-400">
          Upload a Gemini-generated HTML file and a thumbnail, then publish it to the home page.
        </p>
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

      <form onSubmit={handleSubmit} className="glass-card grid gap-4 rounded-3xl p-5 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-white">
            {editingId ? "Edit game" : "Add game"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-slate-400 hover:text-white"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <label className="text-sm text-slate-300">
          Title
          <input
            required
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-indigo-400"
          />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm((current) => ({ ...current, isActive: event.target.checked }))
            }
          />
          isActive
        </label>

        <label className="md:col-span-2 text-sm text-slate-300">
          Description
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-indigo-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          Thumbnail image {editingId ? "(optional replace)" : ""}
          <input
            type="file"
            accept="image/*"
            required={!editingId}
            onChange={(event) =>
              setForm((current) => ({ ...current, thumbnailFile: event.target.files?.[0] || null }))
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-500 file:px-3 file:py-1 file:text-white"
          />
        </label>

        <label className="text-sm text-slate-300">
          HTML file {editingId ? "(optional replace)" : ""}
          <input
            type="file"
            accept=".html,text/html"
            required={!editingId}
            onChange={(event) =>
              setForm((current) => ({ ...current, htmlFile: event.target.files?.[0] || null }))
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-500 file:px-3 file:py-1 file:text-white"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {editingId ? <Pencil size={16} /> : <Plus size={16} />}
          {saving ? "Saving..." : editingId ? "Save changes" : "Create game"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-white">All games</h2>
        {loading ? (
          <div className="glass-card h-40 animate-pulse rounded-3xl" />
        ) : games.length ? (
          games.map((game) => (
            <article
              key={game.id}
              className="glass-card flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center"
            >
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="h-20 w-full rounded-2xl object-cover sm:w-32"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-white">{game.title}</h3>
                  <span
                    className={
                      game.isActive
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300"
                    }
                  >
                    {game.isActive ? "active" : "disabled"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{game.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(game)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(game)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  <Power size={14} />
                  {game.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(game)}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="glass-card rounded-3xl px-6 py-12 text-center text-slate-400">
            <Upload className="mx-auto mb-3" />
            No games yet. Use the form above to add the first one.
          </div>
        )}
      </div>
    </section>
  );
}
