import { ArrowUpRight, BarChart3, Search, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
export default function Home() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="kicker">Relay control room</p>
          <h1>Intelligent web traffic.</h1>
          <p className="subhead">Your gateway to a concurrent web proxy.</p>
        </div>
        <div className="system-pill">
          <Activity size={15} /> Proxy architecture / online
        </div>
      </header>
      <section className="hero-strip">
        <div>
          <span className="hero-index">01 / 02</span>
          <h2>
            Observe the path
            <br />
            <em>of every request.</em>
          </h2>
          <p>
            Search through the live HTTP proxy or inspect the data your database
            has actually collected.
          </p>
        </div>
        <div className="signal-art">
          <i />
          <i />
          <i />
          <i />
          <span>RELAY.</span>
        </div>
      </section>
      <div className="action-grid">
        <Link to="/search" className="action-card">
          <div className="action-icon">
            <Search size={21} />
          </div>
          <span className="card-index">01</span>
          <h2>Search website</h2>
          <p>
            Route an HTTP request through the C proxy and view the returned
            response.
          </p>
          <span className="card-link">
            Open search <ArrowUpRight size={16} />
          </span>
        </Link>
        <Link to="/analytics" className="action-card accent">
          <div className="action-icon">
            <BarChart3 size={21} />
          </div>
          <span className="card-index">02</span>
          <h2>Analytics</h2>
          <p>
            Inspect real request logs, cache metadata, and thread activity from
            MySQL.
          </p>
          <span className="card-link">
            View analytics <ArrowUpRight size={16} />
          </span>
        </Link>
      </div>
      <p className="honesty-note">
        Live data only. Empty states mean the proxy has not written telemetry
        yet.
      </p>
    </div>
  );
}
