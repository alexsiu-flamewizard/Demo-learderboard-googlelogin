import { useAuth } from "../contexts/AuthContext";

export function useAdmin() {
  const { userProfile, loading, isAdmin } = useAuth();

  return {
    isAdmin: Boolean(isAdmin),
    role: userProfile?.role || "user",
    loading,
    userProfile,
  };
}
