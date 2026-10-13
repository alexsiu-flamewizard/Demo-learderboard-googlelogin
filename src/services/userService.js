import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

function assertFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Copy .env.example to .env and fill in your keys.");
  }
}

export async function getUserProfile(uid) {
  assertFirebase();

  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("getUserProfile failed:", error);
    throw new Error(error.message || "Failed to load user profile.");
  }
}

export async function ensureUserDocument(user) {
  assertFirebase();

  if (!user?.uid) {
    throw new Error("Missing authenticated user.");
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    const now = serverTimestamp();

    if (!snapshot.exists()) {
      const profile = {
        uid: user.uid,
        displayName: user.displayName || "Player",
        email: user.email || "",
        photoURL: user.photoURL || "",
        role: "user",
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userRef, profile);
      return { ...profile, createdAt: new Date(), updatedAt: new Date() };
    }

    const existing = snapshot.data();
    const nextProfile = {
      displayName: user.displayName || existing.displayName || "Player",
      email: user.email || existing.email || "",
      photoURL: user.photoURL || existing.photoURL || "",
      updatedAt: now,
    };

    await updateDoc(userRef, nextProfile);

    return {
      id: snapshot.id,
      ...existing,
      ...nextProfile,
    };
  } catch (error) {
    console.error("ensureUserDocument failed:", error);
    throw new Error(error.message || "Failed to save user profile.");
  }
}
