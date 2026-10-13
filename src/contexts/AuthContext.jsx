import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../firebase";
import { ensureUserDocument } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError("");

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const profile = await ensureUserDocument(firebaseUser);
        setUserProfile(profile);
      } catch (profileError) {
        console.error(profileError);
        setUserProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "Player",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          role: "user",
        });
        setError(profileError.message || "Signed in, but the user profile could not be saved.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Firebase is not configured yet. Add your keys to a local .env file.");
      return;
    }

    setAuthBusy(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (loginError) {
      console.error(loginError);
      setError(loginError.message || "Google login failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    if (!auth) return;

    setAuthBusy(true);
    setError("");

    try {
      await signOut(auth);
    } catch (logoutError) {
      console.error(logoutError);
      setError(logoutError.message || "Logout failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      authBusy,
      error,
      setError,
      isAdmin: userProfile?.role === "admin",
      loginWithGoogle,
      logout,
      isFirebaseConfigured,
    }),
    [user, userProfile, loading, authBusy, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
