import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import GlowBackground from "../components/GlowBackground";
import Logo from "../components/Logo";
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <GlowBackground />
      <header className="auth-header">
        <Logo />
        <span className="secure">
          <ShieldCheck size={14} /> Secure workspace
        </span>
      </header>
      <div className="auth-grid">
        <section className="auth-pitch">
          <p className="kicker">Intelligent web traffic</p>
          <h1>
            Make every
            <br />
            <em>request count.</em>
          </h1>
          <p>
            Route website requests through a concurrent proxy, benefit from LRU
            caching, and understand real server performance.
          </p>
          <div className="pitch-link">
            <span>Built for observable infrastructure</span>
            <ArrowUpRight size={17} />
          </div>
        </section>
        <section className="auth-card">
          <Outlet />
        </section>
      </div>
      <footer>
        <span>RELAY. / Proxy analytics</span>
        <Link to="/forgot-password">Need access help?</Link>
      </footer>
    </div>
  );
}
