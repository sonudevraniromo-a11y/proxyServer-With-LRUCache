export default function StatusBadge({ hit, status }) {
  const label = hit === true ? "HIT" : hit === false ? "MISS" : status || "N/A";
  return (
    <span
      className={`status-badge ${hit === true ? "is-hit" : hit === false ? "is-miss" : ""}`}
    >
      {label}
    </span>
  );
}
