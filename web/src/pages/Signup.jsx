import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signup } from "../services/authApi";
import ErrorMessage from "../components/ErrorMessage";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords do not match.");
    setBusy(true);
    try {
      await signup(form);
      navigate("/login");
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="form-heading">
        <p className="kicker">Create access</p>
        <h2>Join the network.</h2>
        <p>Your account starts with standard USER access.</p>
      </div>
      <form onSubmit={submit} className="auth-form compact">
        <label>
          Full name
          <input name="name" value={form.name} onChange={update} required />
        </label>
        <div className="two-fields">
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={update}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              required
            />
          </label>
        </div>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={update}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={update}
            required
          />
        </label>
        <label className="checkbox terms">
          <input type="checkbox" required /> I agree to the workspace terms
        </label>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button className="primary-button" disabled={busy}>
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="form-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
