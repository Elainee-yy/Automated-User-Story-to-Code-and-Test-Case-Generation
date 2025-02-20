import React from 'react';
import { useNavigate } from "react-router-dom";
import './Login.css';

export default function Login() {
    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Welcome Back!</h2>
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <button className="login-btn">Login</button>
                <p>Don't have an account? <a href="/signup">Sign Up</a></p>
            </div>
        </div>
    );
}
