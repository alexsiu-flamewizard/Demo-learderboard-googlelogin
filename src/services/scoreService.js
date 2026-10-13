import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

function assertFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Copy .env.example to .env and fill in your keys.");
  }
}

export function formatScoreDate(value) {
  if (!value) return "-";

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

export async function getScoresByGame(gameId) {
  assertFirebase();

  try {
    const snapshot = await getDocs(
      query(collection(db, "scores"), where("gameId", "==", gameId))
    );

    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => Number(b.score) - Number(a.score));
  } catch (error) {
    console.error("getScoresByGame failed:", error);
    throw new Error(error.message || "Failed to load leaderboard.");
  }
}

export async function getBestScoresByGame(gameId) {
  const scores = await getScoresByGame(gameId);
  const bestByUser = new Map();

  scores.forEach((row) => {
    const uid = row.userId || "";
    if (!uid) return;
    const prev = bestByUser.get(uid);
    if (!prev || Number(row.score) > Number(prev.score)) {
      bestByUser.set(uid, row);
    }
  });

  return [...bestByUser.values()].sort((a, b) => Number(b.score) - Number(a.score));
}

export async function submitScore({
  userId,
  gameId,
  userName,
  userPhotoURL,
  email,
  score,
  stage,
}) {
  assertFirebase();

  const numericScore = Number(score);
  if (!userId) throw new Error("You must be signed in to submit a score.");
  if (!gameId) throw new Error("Missing game id.");
  if (!Number.isFinite(numericScore)) throw new Error("Score must be a number.");

  try {
    await addDoc(collection(db, "scores"), {
      userId,
      gameId,
      userName: userName || "Player",
      userPhotoURL: userPhotoURL || "",
      email: email || "",
      score: numericScore,
      stage: stage || "",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("submitScore failed:", error);
    throw new Error(error.message || "Failed to submit score.");
  }
}
