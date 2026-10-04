import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/register';
import Login from './components/login'; // Import the newly created Login component
import Navbar from './components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  // State to manage the authenticated user session
  const [user, setUser] = useState(null);

  // Check for an existing session in localStorage on initial component load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Navbar is rendered only when a user is logged in */}
        {user && <Navbar user={user} setUser={setUser} />}

        <div className="main-content">
          <Routes>
            {/* Login route: Redirects to home if already authenticated, otherwise renders Login page */}
            <Route 
              path="/login" 
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} 
            />
            
            {/* Register route: Redirects to home if already authenticated, otherwise renders Register page */}
            <Route 
              path="/register" 
              element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} 
            />
            
            {/* Dashboard route: Renders main content if authenticated, otherwise redirects to login */}
            <Route 
              path="/" 
              element={user ? (
                <div className="container mt-5 text-center">
                  <h1>Welcome to bites Dashboard!</h1>
                  <p>Main content and restaurant listings will appear here.</p>
                </div>
              ) : (
                <Navigate to="/login" />
              )} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;