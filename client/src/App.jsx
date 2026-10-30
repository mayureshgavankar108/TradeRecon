import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

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
      const response = await axios.get(
        "http://localhost:4000/api/recon"
      );

      setHistory(response.data.result);
    } 
    catch (err) 
    {
      setHistoryError(
        err.response?.data?.message ||
          "Unable to load reconciliation history."
      );
    } 
    finally 
    {
      setHistoryLoading(false);
    }
  }

  fetchHistory();
}, []);

  async function handleReconcile() 
  {
    if (!internalFile || !custodianFile) 
    {
      setError("Please select both CSV files.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try 
    {
      const formData = new FormData();

      formData.append("internalFile", internalFile);
      formData.append("custodianFile", custodianFile);

      const response = await axios.post(
        "http://localhost:4000/api/recon",
        formData
      );

      setResult(response.data);
      console.log("FULL API RESPONSE:", response.data);
      console.log("Response keys:", Object.keys(response.data));
    } 
    catch (err) 
    {
      setError(
        err.response?.data?.message ||
          "Reconciliation failed. Please check the backend server and CSV files."
      );
    } 
    finally 
    {
      setLoading(false);
    }
  }

  async function handleViewRun(runId) {
  setDetailsLoading(true);
  setHistoryError("");

  try {
    const response = await axios.get(
      `http://localhost:4000/api/recon/${runId}`
    );

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

  const filteredBreaks = result?.breaks?.filter((item) => {
    return breakFilter === "ALL" || item.break_type === breakFilter;
  }) ?? [];

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src = '/traderecon-logo.png' alt = "TradeRecond Logo" className="brand-logo"></img>

          <div>
            <h2>TradeRecon</h2>
            <p>Trade Reconciliation Platform</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="main">
        <section className="page-heading">
          <div>
            <p className="eyebrow">OPERATIONS / RECONCILIATION</p>
            <h1>Reconciliation Dashboard</h1>
            <p className="subtitle">
              Compare internal trades against custodian records.
            </p>
          </div>
        </section>

        <section className="upload-section">
          <div className="section-heading">
            <div>
              <h2>New Reconciliation</h2>
              <p>Upload both files to identify discrepancies.</p>
            </div>
          </div>

          <div className="upload-grid">
            <div className="upload-card">
              <div className="upload-icon">01</div>
              <h3>Internal Trades</h3>
              <p>Upload your internal trade records.</p>

              <label className="file-label">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    setInternalFile(event.target.files?.[0] || null)
                  }
                />

                <span>
                  {internalFile
                    ? internalFile.name
                    : "Choose internal CSV"}
                </span>
              </label>

              <span className="file-hint">CSV format only</span>
            </div>

            <div className="upload-card">
              <div className="upload-icon">02</div>
              <h3>Custodian Trades</h3>
              <p>Upload the custodian's trade records.</p>

              <label className="file-label">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    setCustodianFile(event.target.files?.[0] || null)
                  }
                />

                <span>
                  {custodianFile
                    ? custodianFile.name
                    : "Choose custodian CSV"}
                </span>
              </label>

              <span className="file-hint">CSV format only</span>
            </div>
          </div>

          <button
            className="reconcile-button"
            onClick={handleReconcile}
            disabled={loading}
          >
            {loading ? "Reconciling..." : "Run Reconciliation"}
            {!loading && <span>→</span>}
          </button>

          {error && <div className="error-message">{error}</div>}
        </section>

        {result && (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RUN #{result.run_id}</p>
                <h2>Reconciliation Results</h2>
                <p>Your reconciliation run has been saved.</p>
              </div>

              <span className="success-badge">Completed</span>
            </div>

            <div className="stats-grid">
              <StatCard
                label="Internal Trades"
                value={result.total_internal}
              />

              <StatCard
                label="Custodian Trades"
                value={result.total_custodian}
              />

              <StatCard label="Matched Trades" value={result.matched} />

              <StatCard
                label="Total Breaks"
                value={result.breaks.length}
                highlight
              />
            </div>

          <div className="breaks-section">

  <div className="breaks-heading">
    <div>
      <h3>Reconciliation Breaks</h3>
      <p>Review trades that require attention.</p>
    </div>

    <select
      value={breakFilter}
      onChange={(event) => setBreakFilter(event.target.value)}
    >
      <option value="ALL">All Breaks</option>
      <option value="MISSING_IN_CUSTODIAN">
        Missing in Custodian
      </option>
      <option value="MISSING_IN_INTERNAL">
        Missing in Internal
      </option>
      <option value="QUANTITY_MISMATCH">
        Quantity Mismatch
      </option>
      <option value="PRICE_MISMATCH">
        Price Mismatch
      </option>
    </select>
  </div>

  <div className="table-container">
    <table className="breaks-table">
      <thead>
        <tr>
          <th>Trade ID</th>
          <th>Break Type</th>
          <th>Internal Qty</th>
          <th>Custodian Qty</th>
          <th>Internal Price</th>
          <th>Custodian Price</th>
        </tr>
      </thead>

      <tbody>
        {filteredBreaks.length > 0 ? (
          filteredBreaks.map((item, index) => (
            <tr key={`${item.trade_id}-${item.break_type}-${index}`}>
              <td className="trade-id">{item.trade_id}</td>
              <td>
                <span className="break-badge">
                  {item.break_type.replaceAll("_", " ")}
                </span>
              </td>
              <td>{item.internal_qty ?? "—"}</td>
              <td>{item.custodian_qty ?? "—"}</td>
              <td>
                {item.internal_price == null
                  ? "—"
                  : Number(item.internal_price).toFixed(2)}
              </td>
              <td>
                {item.custodian_price == null
                  ? "—"
                  : Number(item.custodian_price).toFixed(2)}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="empty-state">
              No breaks found for this filter.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  <p className="breaks-count">
    Showing {filteredBreaks.length} of {result.breaks.length} breaks
  </p>
    </div>
  </section>
)}

<section className="history-section">
  <div className="section-heading">
    <div>
      <h2>Reconciliation History</h2>
      <p>Review previously completed reconciliation runs.</p>
    </div>
  </div>

  {historyLoading ? (
    <p className="history-message">Loading reconciliation history...</p>
  ) : historyError ? (
    <p className="error-message">{historyError}</p>
  ) : (history?.length ?? 0) === 0 ? (
    <p className="history-message">No reconciliation runs found.</p>
  ) : (
    <div className="table-container">
      <table className="breaks-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Created At</th>
            <th>Internal</th>
            <th>Custodian</th>
            <th>Matched</th>
            <th>Breaks</th>
            <th>Action</th>
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

              <td>{run.total_internal}</td>
              <td>{run.total_custodian}</td>
              <td>{run.matched}</td>
              <td>{run.breaks}</td>

              <td>
                <button
                  className="view-button"
                  onClick={() => handleViewRun(run.r_id)}
                  disabled={detailsLoading}
                >
                  View Details
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
  <section className="history-section selected-run">
    <div className="section-heading">
      <div>
        <h2>Run #{selectedRun.reconResult.r_id} Details</h2>
        <p>Detailed reconciliation results for this run.</p>
      </div>

      <button
        className="view-button"
        onClick={() => setSelectedRun(null)}
      >
        Close Details
      </button>
    </div>

    <div className="stats-grid">
      <StatCard
        label="Internal Trades"
        value={selectedRun.reconResult.total_internal}
      />

      <StatCard
        label="Custodian Trades"
        value={selectedRun.reconResult.total_custodian}
      />

      <StatCard
        label="Matched Trades"
        value={selectedRun.reconResult.matched}
      />

      <StatCard
        label="Total Breaks"
        value={selectedRun.breakResult.length}
        highlight
      />
    </div>

    <h3 className="selected-breaks-heading">Break Details</h3>

    <div className="table-container">
      <table className="breaks-table">
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Break Type</th>
            <th>Internal Qty</th>
            <th>Custodian Qty</th>
            <th>Internal Price</th>
            <th>Custodian Price</th>
          </tr>
        </thead>

        <tbody>
          {selectedRun.breakResult.length > 0 ? (
            selectedRun.breakResult.map((item, index) => (
              <tr key={`${item.trade_id}-${index}`}>
                <td className="trade-id">{item.trade_id}</td>
                <td>
                  <span className="break-badge">
                    {item.break_type.replaceAll("_", " ")}
                  </span>
                </td>
                <td>{item.internal_qty ?? "—"}</td>
                <td>{item.custodian_qty ?? "—"}</td>
                <td>
                  {item.internal_price == null
                    ? "—"
                    : Number(item.internal_price).toFixed(2)}
                </td>
                <td>
                  {item.custodian_price == null
                    ? "—"
                    : Number(item.custodian_price).toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-state">
                No breaks found for this run.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}

      </main>

      <footer className="footer">
        TradeRecon · Trade reconciliation and exception management
      </footer>
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