import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from './common/FormInput';
import BackgroundDoodles from './common/BackgroundDoodles';
import './common/auth.css';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [wasValidated, setWasValidated] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setWasValidated(true);
        setGeneralError('');

        if (!username || !password) {
            setGeneralError('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                navigate('/');
            } else {
                setGeneralError('Invalid username or password.');
            }
        } catch (error) {
            setGeneralError('Server error, please try again later.');
        }
    };

    return (
        <div className="container register-page-container">
            {/* Navigation to Register */}
            <div style={{ position: 'absolute', top: '35px', right: '20px', zIndex: 1000 }}>
                <Link to="/register" className="btn btn-outline-info rounded-pill px-4 fw-bold shadow-sm">
                    Sign Up
                </Link>
            </div>

            <BackgroundDoodles />

            <div className="bites-logo-container">
                <div className="delivery-scooter"><span className="scooter-mirror">🛵</span></div>
                <div className="bites-logo-text">bites</div>
            </div>

            <div className="register-card">
                <div className="register-header">
                    <h2 className="register-title">Welcome Back!</h2>
                    <p className="register-subtitle">Log in to continue your delicious journey.</p>
                </div>

                {generalError && <div className="wolt-alert-danger" role="alert">⚠️ {generalError}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <FormInput
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        wasValidated={wasValidated}
                        isValid={username !== ''}
                    />
                    <FormInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        wasValidated={wasValidated}
                        isValid={password !== ''}
                    />
                    <button type="submit" className="wolt-btn wolt-btn-block">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;