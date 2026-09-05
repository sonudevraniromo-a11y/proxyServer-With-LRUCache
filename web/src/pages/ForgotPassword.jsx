import { Link } from "react-router-dom";
export default function ForgotPassword() {
  return (
    <>
      <div className="form-heading">
        <p className="kicker">Account recovery</p>
        <h2>Reset access.</h2>
        <p>
          Password reset email delivery is not implemented by the current
          backend.
        </p>
      </div>
      <div className="notice">
        <strong>Backend support required</strong>
        <span>
          The existing project has no reset-token table, email provider, or
          reset API. Your account administrator can manage credentials directly
          in MySQL.
        </span>
      </div>
      <Link className="primary-button link-button" to="/login">
        Return to sign in
      </Link>
    </>
  );
}
