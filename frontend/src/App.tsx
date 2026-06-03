import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import { PrivateRoute } from "./components/PrivateRoute.js";
import { Login } from "./pages/Login.js";
import { Signup } from "./pages/Signup.js";
import { Verify } from "./pages/Verify.js";
import { ForgotPassword } from "./pages/ForgotPassword.js";
import { Home } from "./pages/Home.js";
import { Layout } from "./components/Layout.js";
import { ComplaintsList } from "./pages/ComplaintsList.js";
import { ComplaintDetails } from "./pages/ComplaintDetails.js";
import { AdminDashboard } from "./pages/AdminDashboard.js";
import { Profile } from "./pages/Profile.js";
import { Settings } from "./pages/Settings.js";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected User Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/complaints" element={<Layout><ComplaintsList /></Layout>} />
              <Route path="/complaints/:id" element={<Layout><ComplaintDetails /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
