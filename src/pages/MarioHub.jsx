import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MARIO_GAME_ID, MARIO_GAME_SRC } from "../constants";
import { isFirebaseConfigured } from "../firebase";
import { getBestScoresByGame, submitScore } from "../services/scoreService";

function playerTag(name, email) {
  const src = String(name || email || "PLAY")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return (src.slice(0, 4) || "PLAY").padEnd(4, "X");
}

function toBoardEntry(row) {
  return {
    uid: row.userId || "",
    email: row.email || "",
    displayName: row.userName || "Player",
    photoURL: row.userPhotoURL || "",
    tag: playerTag(row.userName, row.email),
    score: Number(row.score) || 0,
    stage: row.stage || "W1-1",
  };
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function MarioHub() {
  const hubRef = useRef(null);
  const iframeRef = useRef(null);
  const pendingScoreRef = useRef(null);
  const savingRef = useRef(false);
  const { user, userProfile, loading, authBusy, error, isAdmin, loginWithGoogle, logout } =
    useAuth();
  const [toast, setToast] = useState("");

  const postToGame = useCallback((payload) => {
    iframeRef.current?.contentWindow?.postMessage(payload, "*");
  }, []);

  const syncUser = useCallback(() => {
    postToGame({
      type: "USER_INFO",
      uid: user?.uid || "",
      email: userProfile?.email || user?.email || "",
      displayName: userProfile?.displayName || user?.displayName || "",
      photoURL: userProfile?.photoURL || user?.photoURL || "",
    });
  }, [postToGame, user, userProfile]);

  const currentDisplayMode = () =>
    document.fullscreenElement || document.webkitFullscreenElement ? "fullscreen" : "windowed";

  const syncDisplayMode = useCallback(() => {
    postToGame({ type: "DISPLAY_MODE", mode: currentDisplayMode() });
  }, [postToGame]);

  const applyDisplayMode = useCallback(async (mode) => {
    const root = hubRef.current || document.documentElement;
    try {
      if (mode === "fullscreen") {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const request = root.requestFullscreen || root.webkitRequestFullscreen;
          if (request) await request.call(root);
        }
      } else if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
      }
    } catch (displayError) {
      console.error(displayError);
      setToast("FULLSCREEN NOT AVAILABLE");
    } finally {
      syncDisplayMode();
    }
  }, [syncDisplayMode]);

  const syncBoard = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    try {
      const scores = await getBestScoresByGame(MARIO_GAME_ID);
      postToGame({ type: "LEADERBOARD", entries: scores.map(toBoardEntry) });
    } catch (boardError) {
      console.error(boardError);
    }
  }, [postToGame]);

  const savePendingScore = useCallback(async () => {
    const pending = pendingScoreRef.current;
    if (!pending || !user || savingRef.current || !isFirebaseConfigured) return;

    savingRef.current = true;
    try {
      await submitScore({
        userId: user.uid,
        gameId: MARIO_GAME_ID,
        userName: userProfile?.displayName || user.displayName || "Player",
        userPhotoURL: userProfile?.photoURL || user.photoURL || "",
        email: userProfile?.email || user.email || "",
        score: pending.score,
        stage: pending.stage,
      });
      pendingScoreRef.current = null;
      postToGame({ type: "SCORE_RESULT", ok: true });
      setToast("SCORE SAVED TO LEADERBOARD");
      await syncBoard();
    } catch (saveError) {
      console.error(saveError);
      postToGame({
        type: "SCORE_RESULT",
        ok: false,
        reason: saveError.message || "save-failed",
      });
      setToast(saveError.message || "Could not save score.");
    } finally {
      savingRef.current = false;
    }
  }, [postToGame, syncBoard, user, userProfile]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  useEffect(() => {
    if (user) savePendingScore();
  }, [user, savePendingScore]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleGameMessage(event) {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "REQUEST_USER") {
        syncUser();
        return;
      }

      if (data.type === "REQUEST_LEADERBOARD") {
        syncBoard();
        return;
      }

      if (data.type === "REQUEST_LOGIN") {
        if (!user) loginWithGoogle();
        return;
      }

      if (data.type === "REQUEST_DISPLAY_MODE") {
        syncDisplayMode();
        return;
      }

      if (data.type === "SET_DISPLAY_MODE") {
        applyDisplayMode(data.mode === "fullscreen" ? "fullscreen" : "windowed");
        return;
      }

      if (data.type === "GAME_SCORE") {
        const nextScore = Number(data.score);
        if (!Number.isFinite(nextScore)) return;
        pendingScoreRef.current = {
          score: Math.max(0, Math.floor(nextScore)),
          stage: data.stage || "W1-1",
        };
        if (!user) {
          postToGame({ type: "SCORE_RESULT", ok: false, reason: "login" });
          setToast("SIGN IN TOP-RIGHT TO SAVE YOUR SCORE");
          return;
        }
        savePendingScore();
      }
    }

    window.addEventListener("message", handleGameMessage);
    return () => window.removeEventListener("message", handleGameMessage);
  }, [applyDisplayMode, loginWithGoogle, postToGame, savePendingScore, syncBoard, syncDisplayMode, syncUser, user]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncDisplayMode);
    document.addEventListener("webkitfullscreenchange", syncDisplayMode);
    return () => {
      document.removeEventListener("fullscreenchange", syncDisplayMode);
      document.removeEventListener("webkitfullscreenchange", syncDisplayMode);
    };
  }, [syncDisplayMode]);

  const displayName = userProfile?.displayName || user?.displayName || "PLAYER";
  const photoURL = userProfile?.photoURL || user?.photoURL || "";

  return (
    <div className="mario-hub" ref={hubRef}>
      <iframe
        ref={iframeRef}
        src={MARIO_GAME_SRC}
        title="SUPER MARIO"
        className="mario-hub-frame"
        sandbox="allow-scripts allow-pointer-lock allow-same-origin"
        allow="fullscreen"
        onLoad={() => {
          syncUser();
          syncBoard();
        }}
      />

      <div className="mario-auth">
        {loading ? (
          <div className="mario-auth-chip">LOADING...</div>
        ) : user ? (
          <div className="mario-auth-chip mario-auth-user">
            {photoURL ? (
              <img src={photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="mario-auth-fallback">{displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <span className="mario-auth-name" title={user.email || displayName}>
              {displayName}
            </span>
            <button type="button" onClick={logout} disabled={authBusy}>
              LOG OUT
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mario-google-btn"
            onClick={loginWithGoogle}
            disabled={authBusy}
          >
            <GoogleMark />
            {authBusy ? "SIGNING IN..." : "SIGN IN WITH GOOGLE"}
          </button>
        )}
        {isAdmin ? (
          <Link to="/admin" className="mario-admin-link">
            ADMIN
          </Link>
        ) : null}
        {error ? <p className="mario-auth-error">{error}</p> : null}
      </div>

      {toast ? <div className="mario-toast">{toast}</div> : null}
    </div>
  );
}
