import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { PrivateRoute } from "./components/PrivateRoute.js";
import { Login } from "./pages/Login.js";
import { Signup } from "./pages/Signup.js";
import { Verify } from "./pages/Verify.js";
import { ForgotPassword } from "./pages/ForgotPassword.js";
import { Home } from "./pages/Home.js";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            {/* We will add other routes here (/complaints, /profile, /settings, /admin) */}
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
