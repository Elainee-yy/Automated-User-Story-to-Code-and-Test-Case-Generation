import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    yourName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let errors = {};

    if (!formData.yourName?.trim()) errors.yourName = "Name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim() || !emailRegex.test(formData.email))
      errors.email = "Invalid email format";

    const phoneRegex = /^[0-9-]+$/;
    if (!formData.phone?.trim() || !phoneRegex.test(formData.phone))
      errors.phone = "Invalid phone number";

    if (!formData.dob) errors.dob = "Date of birth is required";

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!formData.password?.trim() || !passwordRegex.test(formData.password))
      errors.password =
        "Password must have 8+ characters, uppercase, lowercase, number & special character";

    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    return errors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value || "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      setTimeout(() => {
        alert("Sign-up successful! 🎉");
        navigate("/login");
      }, 1500);
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Your Name</label>
            <input
              type="text"
              name="yourName"
              placeholder="Enter your full name"
              value={formData.yourName}
              onChange={handleChange}
            />
            {errors.yourName && <span className="error">{errors.yourName}</span>}
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <label>Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            {errors.dob && <span className="error">{errors.dob}</span>}
          </div>

          <div className="input-group password-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              </span>
            </div>
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span className="login-span" onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
