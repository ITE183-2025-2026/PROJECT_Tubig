// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getCurrentUser } from "./api/authApi";

import LoginModal from "./components/LoginModal";
import Home from "./pages/Home";
import Users from "./pages/Users";
import MapPage from "./pages/MapPage";

import "./index.css";


function App() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  const handleLoginSuccess = async () => {
  const u = await getCurrentUser();
  setUser(u);
};


  return (
    <Router>
      <div className="relative min-h-screen bg-[#0d0d0d] text-white">
        {!user && (
          <>
            <div className="absolute inset-0 z-50 pointer-events-auto">
              <LoginModal onLoginSuccess={handleLoginSuccess} />
            </div>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-none" />
          </>
        )}

        {user && (
          <Routes>
            <Route path="/" element={<Home user={user} setUser={setUser} />} />
            <Route path="/users" element={<Users user={user} setUser={setUser} />} />
            <Route path="/map" element={<MapPage user={user} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;


// (add if we're done with these pages)
// <Route path="/projects" element={<Projects user={user} />} /> 