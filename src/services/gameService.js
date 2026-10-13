import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, isFirebaseConfigured, storage } from "../firebase";

function assertFirebase() {
  if (!isFirebaseConfigured || !db || !storage) {
    throw new Error("Firebase is not configured. Copy .env.example to .env and fill in your keys.");
  }
}

function toGame(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function sortByCreatedAtDesc(games) {
  return [...games].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

function getStoragePathFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const encodedPath = parsed.pathname.split("/o/")[1];
    if (!encodedPath) return null;
    return decodeURIComponent(encodedPath);
  } catch (error) {
    console.error("Could not parse storage path:", error);
    return null;
  }
}

async function deleteStorageFile(url) {
  const path = getStoragePathFromUrl(url);
  if (!path) return;

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    console.warn("Storage file was not deleted:", error.message);
  }
}

export async function uploadGameAsset(path, file, contentType) {
  assertFirebase();

  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, {
      contentType,
      contentDisposition: "inline",
    });
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("uploadGameAsset failed:", error);
    throw new Error(error.message || "Failed to upload file.");
  }
}

export async function getActiveGames() {
  assertFirebase();

  try {
    const snapshot = await getDocs(
      query(collection(db, "games"), where("isActive", "==", true))
    );
    return sortByCreatedAtDesc(snapshot.docs.map(toGame));
  } catch (error) {
    console.error("getActiveGames failed:", error);
    throw new Error(error.message || "Failed to load games.");
  }
}

export async function getAllGames() {
  assertFirebase();

  try {
    const snapshot = await getDocs(collection(db, "games"));
    return sortByCreatedAtDesc(snapshot.docs.map(toGame));
  } catch (error) {
    console.error("getAllGames failed:", error);
    throw new Error(error.message || "Failed to load games.");
  }
}

export async function getGameById(gameId) {
  assertFirebase();

  try {
    const snapshot = await getDoc(doc(db, "games", gameId));
    if (!snapshot.exists()) return null;
    return toGame(snapshot);
  } catch (error) {
    console.error("getGameById failed:", error);
    throw new Error(error.message || "Failed to load game.");
  }
}

export async function createGame({
  title,
  description,
  thumbnailFile,
  htmlFile,
  isActive,
  createdBy,
}) {
  assertFirebase();

  if (!title?.trim()) throw new Error("Title is required.");
  if (!description?.trim()) throw new Error("Description is required.");
  if (!thumbnailFile) throw new Error("Thumbnail image is required.");
  if (!htmlFile) throw new Error("HTML file is required.");

  try {
    const gameRef = doc(collection(db, "games"));
    const gameId = gameRef.id;
    const stamp = Date.now();

    const thumbnailUrl = await uploadGameAsset(
      `games/${gameId}/thumbnail_${stamp}_${thumbnailFile.name}`,
      thumbnailFile,
      thumbnailFile.type || "image/png"
    );

    const htmlFileUrl = await uploadGameAsset(
      `games/${gameId}/game_${stamp}.html`,
      htmlFile,
      "text/html; charset=utf-8"
    );

    await setDoc(gameRef, {
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl,
      htmlFileUrl,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: Boolean(isActive),
    });

    return gameId;
  } catch (error) {
    console.error("createGame failed:", error);
    throw new Error(error.message || "Failed to create game.");
  }
}

export async function updateGame(gameId, {
  title,
  description,
  isActive,
  thumbnailFile,
  htmlFile,
  existingThumbnailUrl,
  existingHtmlFileUrl,
}) {
  assertFirebase();

  if (!title?.trim()) throw new Error("Title is required.");
  if (!description?.trim()) throw new Error("Description is required.");

  try {
    const payload = {
      title: title.trim(),
      description: description.trim(),
      isActive: Boolean(isActive),
      updatedAt: serverTimestamp(),
    };

    if (thumbnailFile) {
      payload.thumbnailUrl = await uploadGameAsset(
        `games/${gameId}/thumbnail_${Date.now()}_${thumbnailFile.name}`,
        thumbnailFile,
        thumbnailFile.type || "image/png"
      );
      await deleteStorageFile(existingThumbnailUrl);
    }

    if (htmlFile) {
      payload.htmlFileUrl = await uploadGameAsset(
        `games/${gameId}/game_${Date.now()}.html`,
        htmlFile,
        "text/html; charset=utf-8"
      );
      await deleteStorageFile(existingHtmlFileUrl);
    }

    await updateDoc(doc(db, "games", gameId), payload);
  } catch (error) {
    console.error("updateGame failed:", error);
    throw new Error(error.message || "Failed to update game.");
  }
}

export async function setGameActive(gameId, isActive) {
  assertFirebase();

  try {
    await updateDoc(doc(db, "games", gameId), {
      isActive: Boolean(isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("setGameActive failed:", error);
    throw new Error(error.message || "Failed to update game status.");
  }
}

export async function deleteGame(game, gameId) {
  assertFirebase();

  try {
    await deleteStorageFile(game?.thumbnailUrl);
    await deleteStorageFile(game?.htmlFileUrl);
    await deleteDoc(doc(db, "games", gameId || game?.id));
  } catch (error) {
    console.error("deleteGame failed:", error);
    throw new Error(error.message || "Failed to delete game.");
  }
}
