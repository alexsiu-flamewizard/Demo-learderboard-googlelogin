import { useAdmin } from "../hooks/useAdmin";
import { AccessDenied } from "../pages/AccessDenied";

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="glass-card rounded-3xl px-6 py-16 text-center text-slate-300">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return children;
}
