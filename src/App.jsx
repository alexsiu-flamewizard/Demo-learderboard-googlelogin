import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "./components/AdminRoute";
import { Navbar } from "./components/Navbar";
import { MarioHub } from "./pages/MarioHub";
import { GameDetail } from "./pages/GameDetail";
import { GameLeaderboard } from "./pages/GameLeaderboard";
import { Admin } from "./pages/Admin";
import { AccessDenied } from "./pages/AccessDenied";

function PlatformLayout({ children }) {
  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="page-shell pb-16 pt-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MarioHub />} />
          <Route
            path="/admin"
            element={
              <PlatformLayout>
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              </PlatformLayout>
            }
          />
          <Route
            path="/denied"
            element={
              <PlatformLayout>
                <AccessDenied />
              </PlatformLayout>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <PlatformLayout>
                <GameDetail />
              </PlatformLayout>
            }
          />
          <Route
            path="/leaderboard/:gameId"
            element={
              <PlatformLayout>
                <GameLeaderboard />
              </PlatformLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
