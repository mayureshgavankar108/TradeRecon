import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const BREAK_TYPES = [
  { value: "MISSING_IN_CUSTODIAN", label: "Missing in custodian" },
  { value: "MISSING_IN_INTERNAL", label: "Missing in internal" },
  { value: "QUANTITY_MISMATCH", label: "Quantity mismatch" },
  { value: "PRICE_MISMATCH", label: "Price mismatch" },
];

function App() {
  const [internalFile, setInternalFile] = useState(null);
  const [custodianFile, setCustodianFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [breakFilter, setBreakFilter] = useState("ALL");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await axios.get("/api/recon");

        setHistory(response.data.result);
      } catch (err) {
        setHistoryError(
          err.response?.data?.message ||
            "Unable to load reconciliation history."
        );
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, []);

  async function handleReconcile() {
    if (!internalFile || !custodianFile) {
      setError("Please select both CSV files.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("internalFile", internalFile);
      formData.append("custodianFile", custodianFile);

      const response = await axios.post("/api/recon", formData);

      setResult(response.data);
      console.log("FULL API RESPONSE:", response.data);
      console.log("Response keys:", Object.keys(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Reconciliation failed. Please check the backend server and CSV files."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleViewRun(runId) {
    setDetailsLoading(true);
    setHistoryError("");

    try {
      const response = await axios.get(`/api/recon/${runId}`);

      setSelectedRun(response.data);
    } catch (err) {
      console.error("Failed to fetch run details:", err);
      console.error("Error response:", err.response?.data);

      setHistoryError(
        err.response?.data?.message ||
          "Unable to load reconciliation details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  const filteredBreaks =
    result?.breaks?.filter((item) => {
      return breakFilter === "ALL" || item.break_type === breakFilter;
    }) ?? [];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <img
              src="/traderecon-logo.png"
              alt="TradeRecon logo"
              className="brand-logo"
            />
            <div>
              <h2>TradeRecon</h2>
              <p>Trade reconciliation platform</p>
            </div>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            System online
          </div>
        </div>
      </header>

      <main className="main">
        <section className="page-heading">
          <h1>Reconciliation dashboard</h1>
          <p className="subtitle">
            Compare your internal trade book against the custodian’s records
            and see exactly where they disagree.
          </p>
        </section>

        <section className="panel upload-section">
          <div className="section-heading">
            <div>
              <h2>New reconciliation</h2>
              <p>Upload both files to find discrepancies.</p>
            </div>
          </div>

          <div className="upload-grid">
            <FileCard
              title="Internal trades"
              hint="Your own trade records"
              placeholder="Choose internal CSV"
              file={internalFile}
              onChange={setInternalFile}
            />
            <FileCard
              title="Custodian trades"
              hint="The custodian’s trade records"
              placeholder="Choose custodian CSV"
              file={custodianFile}
              onChange={setCustodianFile}
            />
          </div>

          <div className="action-row">
            <button
              className="reconcile-button"
              onClick={handleReconcile}
              disabled={loading}
            >
              {loading && <span className="spinner" aria-hidden="true"></span>}
              {loading ? "Reconciling…" : "Run reconciliation"}
            </button>
            <span className="action-note">
              Results are saved to history automatically.
            </span>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </section>

        {result && <ResultsPanel
          result={result}
          breakFilter={breakFilter}
          setBreakFilter={setBreakFilter}
          filteredBreaks={filteredBreaks}
        />}

        <section className="panel history-section">
          <div className="section-heading">
            <div>
              <h2>Reconciliation history</h2>
              <p>Review previously completed runs.</p>
            </div>
          </div>

          {historyLoading ? (
            <p className="history-message">Loading reconciliation history…</p>
          ) : historyError ? (
            <p className="error-message" role="alert">
              {historyError}
            </p>
          ) : (history?.length ?? 0) === 0 ? (
            <p className="history-message">
              No runs yet. Upload two files above to create your first one.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Created</th>
                    <th className="num">Internal</th>
                    <th className="num">Custodian</th>
                    <th className="num">Matched</th>
                    <th className="num">Breaks</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((run) => (
                    <tr key={run.r_id}>
                      <td className="trade-id">#{run.r_id}</td>

                      <td>
                        {run.created_at
                          ? new Date(
                              run.created_at.replace(" ", "T") + "Z"
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="num">{run.total_internal}</td>
                      <td className="num">{run.total_custodian}</td>
                      <td className="num">{run.matched}</td>
                      <td className="num">
                        <span
                          className={
                            Number(run.breaks) > 0
                              ? "count-pill warn"
                              : "count-pill ok"
                          }
                        >
                          {run.breaks}
                        </span>
                      </td>

                      <td className="num">
                        <button
                          className="view-button"
                          onClick={() => handleViewRun(run.r_id)}
                          disabled={detailsLoading}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedRun && (
          <section className="panel selected-run">
            <div className="section-heading">
              <div>
                <h2>Run #{selectedRun.reconResult.r_id} details</h2>
                <p>Detailed reconciliation results for this run.</p>
              </div>

              <button
                className="view-button"
                onClick={() => setSelectedRun(null)}
              >
                Close details
              </button>
            </div>

            <div className="stats-grid">
              <StatCard
                label="Internal trades"
                value={selectedRun.reconResult.total_internal}
              />
              <StatCard
                label="Custodian trades"
                value={selectedRun.reconResult.total_custodian}
              />
              <StatCard
                label="Matched trades"
                value={selectedRun.reconResult.matched}
              />
              <StatCard
                label="Total breaks"
                value={selectedRun.breakResult.length}
                highlight
              />
            </div>

            <h3 className="selected-breaks-heading">Break details</h3>

            <BreaksTable
              rows={selectedRun.breakResult}
              emptyText="No breaks found for this run."
            />
          </section>
        )}
      </main>

      <footer className="footer">
        TradeRecon · Trade reconciliation and exception management
      </footer>
    </div>
  );
}

function FileCard({ title, hint, placeholder, file, onChange }) {
  return (
    <div className={`upload-card ${file ? "has-file" : ""}`}>
      <div className="upload-icon" aria-hidden="true">
        {file ? "✓" : "CSV"}
      </div>
      <div className="upload-body">
        <h3>{title}</h3>
        <p>{hint}</p>

        <label className="file-label">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onChange(event.target.files?.[0] || null)}
          />
          <span>{file ? file.name : placeholder}</span>
        </label>
      </div>
    </div>
  );
}

function ResultsPanel({ result, breakFilter, setBreakFilter, filteredBreaks }) {
  const totalBreaks = result.breaks.length;
  const basis = Math.max(result.total_internal ?? 0, result.total_custodian ?? 0);
  const rate = basis > 0 ? (result.matched / basis) * 100 : 0;

  const segments = BREAK_TYPES.map((t) => ({
    ...t,
    count: result.breaks.filter((b) => b.break_type === t.value).length,
  }));

  return (
    <section className="panel results-section">
      <div className="section-heading">
        <div>
          <p className="run-tag">Run #{result.run_id}</p>
          <h2>Reconciliation results</h2>
          <p>Your reconciliation run has been saved.</p>
        </div>

        <span className="success-badge">Completed</span>
      </div>

      <div className="rate-block">
        <div className="rate-figure">
          <span className="rate-value">{rate.toFixed(1)}%</span>
          <span className="rate-label">of trades matched</span>
        </div>

        <div className="rate-visual">
          <div className="rate-bar" role="img" aria-label={`${rate.toFixed(1)}% matched`}>
            <span className="seg matched" style={{ width: `${rate}%` }} />
            {basis > 0 &&
              segments.map((s) => (
                <span
                  key={s.value}
                  className={`seg ${s.value.toLowerCase()}`}
                  style={{ width: `${(s.count / basis) * 100}%` }}
                />
              ))}
          </div>
          <ul className="legend">
            <li>
              <i className="dot matched"></i>Matched
              <b>{result.matched}</b>
            </li>
            {segments.map((s) => (
              <li key={s.value}>
                <i className={`dot ${s.value.toLowerCase()}`}></i>
                {s.label}
                <b>{s.count}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Internal trades" value={result.total_internal} />
        <StatCard label="Custodian trades" value={result.total_custodian} />
        <StatCard label="Matched trades" value={result.matched} />
        <StatCard label="Total breaks" value={totalBreaks} highlight />
      </div>

      <div className="breaks-section">
        <div className="breaks-heading">
          <div>
            <h3>Reconciliation breaks</h3>
            <p>Review trades that need attention.</p>
          </div>

          <select
            value={breakFilter}
            onChange={(event) => setBreakFilter(event.target.value)}
            aria-label="Filter breaks by type"
          >
            <option value="ALL">All breaks</option>
            {BREAK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <BreaksTable
          rows={filteredBreaks}
          emptyText="No breaks found for this filter."
        />

        <p className="breaks-count">
          Showing {filteredBreaks.length} of {totalBreaks} breaks
        </p>
      </div>
    </section>
  );
}

function BreaksTable({ rows, emptyText }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Break type</th>
            <th className="num">Internal qty</th>
            <th className="num">Custodian qty</th>
            <th className="num">Internal price</th>
            <th className="num">Custodian price</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((item, index) => (
              <tr key={`${item.trade_id}-${item.break_type}-${index}`}>
                <td className="trade-id">{item.trade_id}</td>
                <td>
                  <span
                    className={`break-badge ${item.break_type.toLowerCase()}`}
                  >
                    {item.break_type.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="num">{item.internal_qty ?? "—"}</td>
                <td className="num">{item.custodian_qty ?? "—"}</td>
                <td className="num">
                  {item.internal_price == null
                    ? "—"
                    : Number(item.internal_price).toFixed(2)}
                </td>
                <td className="num">
                  {item.custodian_price == null
                    ? "—"
                    : Number(item.custodian_price).toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-state">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`stat-card ${highlight ? "highlight" : ""}`}>
      <p>{label}</p>
      <h2>{value ?? 0}</h2>
    </div>
  );
}

export default App;