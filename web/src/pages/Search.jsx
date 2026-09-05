import { Search as SearchIcon, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { searchProxy } from "../services/analyticsApi";
import GlassCard from "../components/GlassCard";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

export default function Search() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [responseUrl, setResponseUrl] = useState("");
  useEffect(() => {
    if (!result) {
      setResponseUrl("");
      return;
    }
    const bytes = Uint8Array.from(atob(result.response), (character) =>
      character.charCodeAt(0),
    );
    const objectUrl = URL.createObjectURL(
      new Blob([bytes], { type: result.contentType }),
    );
    setResponseUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [result]);
  async function submit(event) {
    event.preventDefault();
    setResult(null);
    setError("");
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid HTTP or HTTPS URL.");
      return;
    }
    setBusy(true);
    try {
      setResult(await searchProxy(url));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="kicker">Live route</p>
          <h1>Search website.</h1>
          <p className="subhead">
            Send a real HTTP request through the RELAY proxy.
          </p>
        </div>
        <div className="protocol-note">
          <ShieldAlert size={15} /> HTTP only / C proxy scope
        </div>
      </header>
      <GlassCard className="search-console">
        <form onSubmit={submit}>
          <label className="search-label">
            Destination URL<span>Proxied by C11 worker pool</span>
          </label>
          <div className="search-input-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="http://example.com"
              aria-label="Destination URL"
            />
            <button className="primary-button" disabled={busy}>
              {busy ? (
                <Loading label="Routing" />
              ) : (
                <>
                  <SearchIcon size={17} /> Route request
                </>
              )}
            </button>
          </div>
        </form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <p className="console-foot">
          The existing proxy supports GET requests with a Host header. HTTPS
          CONNECT is not implemented.
        </p>
      </GlassCard>
      {result && (
        <GlassCard className="result-card">
          <div className="result-heading">
            <div>
              <p className="kicker">Proxy response</p>
              <h2>{result.url}</h2>
            </div>
            <span className="status-code">HTTP {result.status}</span>
          </div>
          <div className="result-meta">
            <span>
              Content type <b>{result.contentType}</b>
            </span>
            <span>Response returned by the C proxy</span>
          </div>
          {responseUrl && (
            <iframe
              title="Proxied website response"
              src={responseUrl}
              className="response-frame"
            />
          )}
        </GlassCard>
      )}
    </div>
  );
}
