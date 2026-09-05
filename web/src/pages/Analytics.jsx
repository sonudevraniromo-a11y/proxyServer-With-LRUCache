import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getCache,
  getRequests,
  getSummary,
  getThreads,
} from "../services/analyticsApi";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import GlassCard from "../components/GlassCard";

export default function Analytics() {
  const [data, setData] = useState({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setBusy(true);
    setError("");
    try {
      const [summary, requests, threads, cache] = await Promise.all([
        getSummary(),
        getRequests(),
        getThreads(),
        getCache(),
      ]);
      setData({
        summary,
        requests: requests.rows,
        threads: threads.rows,
        cache: cache.rows,
      });
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="kicker">Telemetry / MySQL</p>
          <h1>Analytics.</h1>
          <p className="subhead">Real data from your proxy and database.</p>
        </div>
        <button className="ghost-button" onClick={load} disabled={busy}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>
      {busy ? (
        <Loading label="Reading database" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : data.summary?.empty ? (
        <GlassCard className="empty-state">
          <h2>No analytics data available yet.</h2>
          <p>
            Run a request through the C proxy after connecting its database
            logger.
          </p>
        </GlassCard>
      ) : (
        <>
          <section className="metrics-grid">
            <MetricCard
              label="Total requests"
              value={data.summary.total_requests}
            />
            <MetricCard label="Cache hits" value={data.summary.cache_hits} />
            <MetricCard
              label="Cache misses"
              value={data.summary.cache_misses}
            />
            <MetricCard
              label="Hit ratio"
              value={`${data.summary.hit_ratio}%`}
            />
            <MetricCard
              label="Avg response"
              value={`${Number(data.summary.average_response_time).toFixed(1)} ms`}
            />
            <MetricCard
              label="Data transferred"
              value={`${data.summary.total_data_transferred} bytes`}
            />
          </section>
          <GlassCard className="table-card">
            <div className="section-title">
              <div>
                <p className="kicker">Request history</p>
                <h2>Recent traffic</h2>
              </div>
              <span>{data.requests.length} records</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Method</th>
                    <th>Thread</th>
                    <th>Cache</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Size</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((row) => (
                    <tr key={row.id}>
                      <td className="url-cell">{row.url}</td>
                      <td>{row.method}</td>
                      <td>{row.thread_id}</td>
                      <td>
                        <StatusBadge hit={row.cache_hit} />
                      </td>
                      <td>
                        <StatusBadge status={row.status_code} />
                      </td>
                      <td>{row.response_time_ms} ms</td>
                      <td>{row.response_size ?? "n/a"}</td>
                      <td>{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
          <div className="data-columns">
            <GlassCard>
              <div className="section-title">
                <div>
                  <p className="kicker">Workers</p>
                  <h2>Thread activity</h2>
                </div>
              </div>
              <div className="simple-list">
                {data.threads.length ? (
                  data.threads.map((row) => (
                    <div key={row.thread_id}>
                      <b>{row.thread_id}</b>
                      <span>
                        {row.requests} requests /{" "}
                        {Number(row.average_response_time).toFixed(1)} ms avg
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No thread data available.</p>
                )}
              </div>
            </GlassCard>
            <GlassCard>
              <div className="section-title">
                <div>
                  <p className="kicker">Persistent metadata</p>
                  <h2>Cache entries</h2>
                </div>
              </div>
              <div className="simple-list">
                {data.cache.length ? (
                  data.cache.slice(0, 6).map((row) => (
                    <div key={row.url}>
                      <b>{row.url}</b>
                      <span>
                        {row.size_bytes} bytes / {row.hit_count} hits
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No cache metadata available.</p>
                )}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
