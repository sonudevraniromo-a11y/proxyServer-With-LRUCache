export default function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value ?? "n/a"}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
