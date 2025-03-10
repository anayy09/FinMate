import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import InformationPage from "./pages/InformationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PasswordResetPage from "./pages/PasswordResetPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/info" element={<InformationPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/password-reset/:token" element={<PasswordResetPage />} />
      </Routes>
    </Router>
  );
}
