import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CreateComic from './pages/CreateComic';
import Examples from './pages/Examples';
import HowItWorks from './pages/HowItWorks';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Signup from './pages/Signup';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
        <Route path="/examples" element={<Examples />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/create" element={<CreateComic />} />
      </Routes>
    </Router>
  );
}

export default App;
