import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import ErrorMessage from "../components/ErrorMessage";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(identifier, password);
      navigate("/home");
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="form-heading">
        <p className="kicker">Welcome back</p>
        <h2>Sign in to Relay.</h2>
        <p>Enter your credentials to access the control room.</p>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label>
          Username or email
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            autoComplete="username"
            placeholder="you@company.com"
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="form-options">
          <label className="checkbox">
            <input type="checkbox" /> Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button className="primary-button" disabled={busy}>
          {busy ? "Authenticating..." : "Continue"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="form-switch">
        New to Relay? <Link to="/signup">Create an account</Link>
      </p>
    </>
  );
}
