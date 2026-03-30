import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  loginStart,
  loginFailure,
  clearError,
} from "../store/slices/authSlice";
import { getDashboardPath } from "../utils/roleRoutes";
import authService from "../api/authService";
import "./Login.css"; // reuse same styling

const Register = () => {
  const ROLE_OPTIONS = ["employee", "manager", "admin"];

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, user } = useSelector(
    (state) => state.auth,
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
  });
  const [validation, setValidation] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user)
      navigate(getDashboardPath(user.role), { replace: true });
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
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
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!ROLE_OPTIONS.includes(form.role)) {
      errors.role = "Please select a valid role";
    }
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (validation[name]) {
      setValidation((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(loginStart());
    try {
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      // Redirect to login page after successful registration
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please log in with your credentials.",
          email: form.email,
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      dispatch(loginFailure(message));
    }
  };

  return (
    <div className="login-page">
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
              Join your team
              <br />
              <span className="login-branding__highlight">
                get started today
              </span>
            </h1>

            <p className="login-branding__desc">
              Create your account to start managing projects, collaborating with
              your team, and tracking progress effortlessly.
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
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span>Quick & easy setup</span>
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
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <span>Secure & private</span>
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span>Team collaboration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — register form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
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
              <h2 className="login-form-header__title">Create account</h2>
              <p className="login-form-header__subtitle">
                Fill in your details to get started
              </p>
            </div>

            {error && (
              <div
                className="login-alert login-alert--error"
                role="alert"
                id="register-error-alert"
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

            <form
              onSubmit={handleSubmit}
              noValidate
              className="login-form"
              id="register-form"
            >
              {/* Name */}
              <div
                className={`login-field ${validation.name ? "login-field--error" : ""}`}
              >
                <label htmlFor="register-name" className="login-field__label">
                  Full name
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
                {validation.name && (
                  <span className="login-field__error">{validation.name}</span>
                )}
              </div>

              {/* Email */}
              <div
                className={`login-field ${validation.email ? "login-field--error" : ""}`}
              >
                <label htmlFor="register-email" className="login-field__label">
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
                    id="register-email"
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
                <label
                  htmlFor="register-password"
                  className="login-field__label"
                >
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
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div
                className={`login-field ${validation.confirmPassword ? "login-field--error" : ""}`}
              >
                <label
                  htmlFor="register-confirm"
                  className="login-field__label"
                >
                  Confirm password
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
                    id="register-confirm"
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                {validation.confirmPassword && (
                  <span className="login-field__error">
                    {validation.confirmPassword}
                  </span>
                )}
              </div>

              {/* Role */}
              <div
                className={`login-field ${validation.role ? "login-field--error" : ""}`}
              >
                <label htmlFor="register-role" className="login-field__label">
                  Select your role
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <select
                    id="register-role"
                    className="login-field__select"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span
                    className="login-field__select-arrow"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
                <span className="login-field__hint">
                  Choose the dashboard and permissions you want for this
                  account.
                </span>
                {validation.role && (
                  <span className="login-field__error">{validation.role}</span>
                )}
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                id="register-submit-btn"
              >
                {loading ? (
                  <span className="login-btn__loading">
                    <span className="login-spinner" />
                    <span>Creating account…</span>
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="login-footer">
              Already have an account?{" "}
              <Link to="/login" className="login-footer__link" id="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
