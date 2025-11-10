// React import not needed with new JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PublicProfile from './pages/PublicProfile';
import { AuthProvider } from './contexts/AuthContext';

const LegacyProfileRedirect = () => {
  const { profileUrl } = useParams();
  return <Navigate to={`/connect/${profileUrl ?? ''}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/connect/:profileUrl" element={<PublicProfile />} />
            <Route path="/user/:profileUrl" element={<LegacyProfileRedirect />} />
            <Route path="/u/:profileUrl" element={<LegacyProfileRedirect />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
