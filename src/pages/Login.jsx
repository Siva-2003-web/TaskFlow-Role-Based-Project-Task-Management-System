import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
} from "../store/slices/authSlice";
import { getDashboardPath } from "../utils/roleRoutes";
import authService from "../api/authService";
import "./Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error, user } = useSelector(
    (state) => state.auth,
  );

  const [form, setForm] = useState({ email: "", password: "" });
  const [validation, setValidation] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user)
      navigate(getDashboardPath(user.role), { replace: true });
  }, [isAuthenticated, user, navigate]);

  // Check for success message from registration redirect
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setForm((prev) => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  // Clear redux error on unmount
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on type
    if (validation[name]) {
      setValidation((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(loginStart());
    try {
      const { data } = await authService.login(form);
      const loggedInUser = data.user || data;
      dispatch(loginSuccess(loggedInUser));
      navigate(getDashboardPath(loggedInUser.role), { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed. Please try again.";
      dispatch(loginFailure(message));
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-gradient" />
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <div className="login-container">
        {/* Left — branding panel */}
        <div className="login-branding">
          <div className="login-branding__content">
            <div className="login-logo">
              <div className="login-logo__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="login-logo__text">TaskFlow</span>
            </div>

            <h1 className="login-branding__title">
              Streamline your
              <br />
              <span className="login-branding__highlight">team's workflow</span>
            </h1>

            <p className="login-branding__desc">
              Manage projects, assign tasks, and track progress — all in one
              centralized platform built for modern teams.
            </p>

            <div className="login-branding__features">
              <div className="login-feature">
                <div className="login-feature__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span>Team Management</span>
              </div>
              <div className="login-feature">
                <div className="login-feature__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </div>
                <span>Project Tracking</span>
              </div>
              <div className="login-feature">
                <div className="login-feature__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span>Task Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — login form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            {/* Mobile logo */}
            <div className="login-mobile-logo">
              <div className="login-logo__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="login-logo__text">TaskFlow</span>
            </div>

            <div className="login-form-header">
              <h2 className="login-form-header__title">Welcome back</h2>
              <p className="login-form-header__subtitle">
                Sign in to your account to continue
              </p>
            </div>

            {/* Server error */}
            {error && (
              <div
                className="login-alert login-alert--error"
                role="alert"
                id="login-error-alert"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="login-alert__icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" x2="9" y1="9" y2="15" />
                  <line x1="9" x2="15" y1="9" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success message from registration */}
            {successMessage && (
              <div
                className="login-alert login-alert--success"
                role="alert"
                id="login-success-alert"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="login-alert__icon"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="login-form"
              id="login-form"
            >
              {/* Email */}
              <div
                className={`login-field ${validation.email ? "login-field--error" : ""}`}
              >
                <label htmlFor="login-email" className="login-field__label">
                  Email address
                </label>
                <div className="login-field__input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="login-field__icon"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {validation.email && (
                  <span className="login-field__error">{validation.email}</span>
                )}
              </div>

              {/* Password */}
              <div
                className={`login-field ${validation.password ? "login-field--error" : ""}`}
              >
                <label htmlFor="login-password" className="login-field__label">
                  Password
                </label>
                <div className="login-field__input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="login-field__icon"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-field__toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" x2="23" y1="1" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {validation.password && (
                  <span className="login-field__error">
                    {validation.password}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? (
                  <span className="login-btn__loading">
                    <span className="login-spinner" />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="login-footer">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="login-footer__link"
                id="register-link"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
