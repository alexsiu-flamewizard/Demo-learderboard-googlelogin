import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../firebase";
import { ensureUserDocument } from "../services/userService";

const AuthContext = createContext(null);

function friendlyAuthError(loginError) {
  const code = loginError?.code || "";
  if (code === "auth/popup-blocked") {
    return "瀏覽器擋住了 Google 登入視窗。請允許彈出視窗後再按一次。";
  }
  if (code === "auth/unauthorized-domain") {
    return "這個網址還沒加入 Firebase 的授權網域。";
  }
  if (code === "auth/network-request-failed") {
    return "連不到 Firebase。請檢查網路後再試。";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase 還沒有啟用 Google 登入。";
  }
  return loginError?.message || "Google 登入失敗。";
}

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

    getRedirectResult(auth).catch((redirectError) => {
      console.error(redirectError);
      setError(friendlyAuthError(redirectError));
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setError("");

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
      if (loginError?.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error(redirectError);
          setError(friendlyAuthError(redirectError));
        }
      } else {
        setError(friendlyAuthError(loginError));
      }
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
