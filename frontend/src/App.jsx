// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./App.css";

// const API_URL = window.location.hostname.includes("localhost")
//   ? "http://localhost:3000"
//   : "http://" + window.location.hostname.replace("dashboard", "api");

// function App() {
//   const [stores, setStores] = useState([]);
//   const [stats, setStats] = useState({
//     total_stores: 0,
//     active_stores: 0,
//     total_failures: 0,
//   });
//   const [newStoreName, setNewStoreName] = useState("");
//   const [isProvisioning, setIsProvisioning] = useState(false);
//   const [logs, setLogs] = useState([]);
//   const [selectedStore, setSelectedStore] = useState(null);

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchData = async () => {
//     try {
//       const storesRes = await axios.get(`${API_URL}/api/stores`);
//       const statsRes = await axios.get(`${API_URL}/api/stats`);
//       setStores(storesRes.data);
//       setStats(statsRes.data);
//     } catch (err) {
//       console.error("Error fetching data:", err);
//     }
//   };

//   const createStore = async () => {
//     if (!newStoreName) return;
//     setIsProvisioning(true);
//     try {
//       await axios.post(`${API_URL}/api/stores`, { storeName: newStoreName });
//       setNewStoreName("");
//       fetchData();
//     } catch (err) {
//       alert(`Failed: ${err.response?.data?.details || err.message}`);
//     } finally {
//       setIsProvisioning(false);
//     }
//   };

//   const deleteStore = async (name) => {
//     if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
//     try {
//       await axios.delete(`${API_URL}/api/stores/${name}`);
//       fetchData();
//     } catch (err) {
//       alert("Failed to delete store");
//     }
//   };

//   const viewLogs = async (name) => {
//     setSelectedStore(name);
//     try {
//       const res = await axios.get(`${API_URL}/api/stores/${name}/events`);
//       setLogs(res.data);
//     } catch (err) {
//       setLogs([{ message: "Could not fetch logs. Store might be deleting." }]);
//     }
//   };

//   const closeLogs = () => {
//     setSelectedStore(null);
//     setLogs([]);
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h1>Platform Dashboard</h1>

//       <div
//         style={{
//           display: "flex",
//           gap: "20px",
//           marginBottom: "20px",
//           padding: "10px",
//           background: "#f4f4f4",
//           borderRadius: "8px",
//         }}
//       >
//         <div>
//           <strong>Total Stores:</strong> {stats.total_stores}
//         </div>
//         <div>
//           <strong>Active:</strong> {stats.active_stores}
//         </div>
//         <div style={{ color: "red" }}>
//           <strong>Failures:</strong> {stats.total_failures}
//         </div>
//       </div>
//       <div style={{ marginBottom: "20px" }}>
//         <input
//           type="text"
//           placeholder="Enter store name (e.g. nike-shop)"
//           value={newStoreName}
//           onChange={(e) => setNewStoreName(e.target.value)}
//           style={{ padding: "8px", marginRight: "10px", width: "250px" }}
//         />
//         <button
//           onClick={createStore}
//           disabled={isProvisioning}
//           style={{
//             padding: "8px 16px",
//             background: isProvisioning ? "#ccc" : "#007bff",
//             color: "white",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           {isProvisioning ? "Provisioning..." : "Launch Store"}
//         </button>
//       </div>

//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr style={{ background: "#eee", textAlign: "left" }}>
//             <th style={{ padding: "10px" }}>Store Name</th>
//             <th style={{ padding: "10px" }}>URL</th>
//             <th style={{ padding: "10px" }}>Status</th>
//             <th style={{ padding: "10px" }}>Observability</th>
//             <th style={{ padding: "10px" }}>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {stores.map((store) => (
//             <tr key={store.name} style={{ borderBottom: "1px solid #ddd" }}>
//               <td style={{ padding: "10px" }}>{store.name}</td>
//               <td style={{ padding: "10px" }}>
//                 <a href={store.url} target="_blank" rel="noopener noreferrer">
//                   {store.url}
//                 </a>
//               </td>
//               <td style={{ padding: "10px" }}>
//                 <span
//                   style={{
//                     padding: "4px 8px",
//                     borderRadius: "12px",
//                     fontSize: "12px",
//                     color: "white",
//                     backgroundColor:
//                       store.status === "Ready" ? "green" : "orange",
//                   }}
//                 >
//                   {store.status}
//                 </span>
//               </td>
//               <td style={{ padding: "10px" }}>
//                 <button
//                   onClick={() => viewLogs(store.name)}
//                   style={{
//                     cursor: "pointer",
//                     background: "none",
//                     border: "1px solid #555",
//                     padding: "4px 8px",
//                     borderRadius: "4px",
//                   }}
//                 >
//                   📜 View K8s Events
//                 </button>
//               </td>
//               <td style={{ padding: "10px" }}>
//                 <button
//                   onClick={() => deleteStore(store.name)}
//                   style={{
//                     background: "red",
//                     color: "white",
//                     border: "none",
//                     padding: "5px 10px",
//                     borderRadius: "4px",
//                     cursor: "pointer",
//                   }}
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {selectedStore && (
//         <div
//           style={{
//             position: "fixed",
//             top: "0",
//             left: "0",
//             right: "0",
//             bottom: "0",
//             backgroundColor: "rgba(0,0,0,0.5)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <div
//             style={{
//               background: "white",
//               padding: "20px",
//               borderRadius: "8px",
//               width: "600px",
//               maxHeight: "80vh",
//               overflowY: "auto",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "10px",
//               }}
//             >
//               <h3>Live Events: {selectedStore}</h3>
//               <button onClick={closeLogs} style={{ cursor: "pointer" }}>
//                 Close
//               </button>
//             </div>
//             <div
//               style={{
//                 background: "#222",
//                 color: "#0f0",
//                 padding: "10px",
//                 borderRadius: "4px",
//                 fontFamily: "monospace",
//                 fontSize: "12px",
//               }}
//             >
//               {logs.length === 0 ? (
//                 <p>No events found yet...</p>
//               ) : (
//                 logs.map((log, i) => (
//                   <div
//                     key={i}
//                     style={{
//                       marginBottom: "5px",
//                       borderBottom: "1px solid #333",
//                     }}
//                   >
//                     <span style={{ color: "#888" }}>
//                       [{new Date(log.lastTimestamp).toLocaleTimeString()}]
//                     </span>
//                     <span
//                       style={{
//                         fontWeight: "bold",
//                         color: log.type === "Warning" ? "red" : "#0f0",
//                       }}
//                     >
//                       {" "}
//                       {log.reason}
//                     </span>
//                     :<span> {log.message}</span>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// --- Icons (Inline SVGs) ---
const Icons = {
  Server: () => (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01"
      />
    </svg>
  ),

  Shield: () => (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  Activity: () => (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  Alert: () => (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  Link: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  ),
  Terminal: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
};

const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "http://" + window.location.hostname.replace("dashboard", "api");

function App() {
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    total_stores: 0,
    active_stores: 0,
    total_failures: 0,
  });
  const [newStoreName, setNewStoreName] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // NEW: Store User ID for Quota tracking
  const [userId, setUserId] = useState("");

  // 1. Initialize User Identity & API Client
  useEffect(() => {
    // Generate persistent ID if missing
    let storedId = localStorage.getItem("urumi_user_id");
    if (!storedId) {
      storedId = "user_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("urumi_user_id", storedId);
    }
    setUserId(storedId);
  }, []);

  // 2. Data Fetching Loop
  useEffect(() => {
    if (!userId) return; // Wait for ID
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [userId]); // Depend on userId

  // Helper to attach headers
  const getApi = () => {
    return axios.create({
      baseURL: API_URL,
      headers: { "x-user-id": userId },
    });
  };

  const fetchData = async () => {
    try {
      const api = getApi();
      const storesRes = await api.get(`/api/stores`);
      const statsRes = await api.get(`/api/stats`);
      setStores(storesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const createStore = async () => {
    if (!newStoreName) return;
    setIsProvisioning(true);
    try {
      const api = getApi();
      await api.post(`/api/stores`, { storeName: newStoreName });
      setNewStoreName("");
      fetchData(); // Immediate refresh
    } catch (err) {
      const msg =
        err.response?.data?.error || err.response?.data?.details || err.message;
      alert(`Provisioning Failed: ${msg}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const deleteStore = async (name) => {
    if (!window.confirm(`Delete store "${name}" permanently?`)) return;
    try {
      const api = getApi();
      await api.delete(`/api/stores/${name}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete store");
    }
  };

  const viewLogs = async (name) => {
    setSelectedStore(name);
    try {
      const api = getApi();
      const res = await api.get(`/api/stores/${name}/events`);
      setLogs(res.data);
    } catch (err) {
      setLogs([
        {
          message: "Could not fetch logs. Store might be deleting.",
          type: "Warning",
        },
      ]);
    }
  };

  const closeLogs = () => {
    setSelectedStore(null);
    setLogs([]);
  };

  const fetchAuditLogs = async () => {
    try {
      const api = getApi();
      const res = await api.get("/api/audit");
      setAuditLogs(res.data);
      setShowAudit(true);
    } catch (err) {
      alert("Failed to fetch audit logs");
    }
  };

  return (
    <div className="app-shell">
      <header className="dashboard-header">
        <div className="brand">
          <h1>Urumi Platform</h1>
          <p>Orchestration Engine v1.0</p>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            ID: {userId}
          </div>
          <button
            onClick={fetchAuditLogs}
            className="action-btn"
            style={{
              padding: "8px 16px",
              fontSize: "0.8rem",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <Icons.Shield /> System Logs
            </div>
          </button>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#6366f1" }}>
            <Icons.Server />
          </div>
          <div className="stat-info">
            <h3>Active Stores</h3>
            <span className="value">{stats.active_stores}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#10b981" }}>
            <Icons.Activity />
          </div>
          <div className="stat-info">
            <h3>Total Deployed</h3>
            <span className="value">{stats.total_stores}</span>
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            borderColor:
              stats.total_failures > 0 ? "rgba(239, 68, 68, 0.3)" : "",
          }}
        >
          <div className="stat-icon" style={{ color: "#ef4444" }}>
            <Icons.Alert />
          </div>
          <div className="stat-info">
            <h3>Failures</h3>
            <span
              className="value"
              style={{ color: stats.total_failures > 0 ? "#ef4444" : "" }}
            >
              {stats.total_failures}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="control-bar">
        <div className="input-wrapper">
          <input
            className="search-input"
            type="text"
            placeholder="Enter store name (e.g. fashion-outlet)"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createStore()}
          />
        </div>
        <button
          className="action-btn"
          onClick={createStore}
          disabled={isProvisioning || !newStoreName}
        >
          {isProvisioning ? "Provisioning..." : "Deploy Store"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid-header">
        <div className="live-indicator"></div>
        <h2>Live Instances</h2>
      </div>

      <div className="store-grid">
        {stores.map((store) => (
          <div key={store.name} className="store-card">
            <div className="card-header">
              <div>
                <h3 className="store-name">{store.name}</h3>
                <div className="store-meta">Engine: WooCommerce</div>
                {/* Show ownership label if needed for debug */}
                {/* <div style={{fontSize:'0.7rem', color:'#666'}}>{store.owner}</div> */}
              </div>
              <span
                className={`status-badge ${
                  store.status === "Ready"
                    ? "status-ready"
                    : "status-provisioning"
                }`}
              >
                {store.status}
              </span>
            </div>

            <div className="card-actions">
              <a
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon"
              >
                <Icons.Link /> Visit
              </a>
              <button onClick={() => viewLogs(store.name)} className="btn-icon">
                <Icons.Terminal /> Logs
              </button>
              <button
                onClick={() => deleteStore(store.name)}
                className="btn-icon btn-delete"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedStore && (
        <div className="modal-overlay" onClick={closeLogs}>
          <div className="terminal-window" onClick={(e) => e.stopPropagation()}>
            <div className="terminal-header">
              <div className="terminal-title">
                <Icons.Terminal /> root@k8s:~/logs/{selectedStore}
              </div>
              <button className="terminal-close" onClick={closeLogs}>
                &times;
              </button>
            </div>
            <div className="terminal-body">
              {logs.length === 0 ? (
                <div style={{ color: "#8b949e" }}>
                  # Waiting for Kubernetes events...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="log-entry">
                    <span className="log-time">
                      [{new Date(log.lastTimestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`log-type type-${log.type}`}>
                      {log.reason}
                    </span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAudit && (
        <div className="modal-overlay" onClick={() => setShowAudit(false)}>
          <div
            className="terminal-window"
            onClick={(e) => e.stopPropagation()}
            style={{ borderColor: "#6366f1" }}
          >
            <div className="terminal-header" style={{ background: "#1e1b4b" }}>
              <div className="terminal-title" style={{ color: "#818cf8" }}>
                <Icons.Shield /> PLATFORM AUDIT TRAIL (admin-only)
              </div>
              <button
                className="terminal-close"
                onClick={() => setShowAudit(false)}
              >
                &times;
              </button>
            </div>
            <div
              className="terminal-body"
              style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
            >
              {auditLogs.length === 0 ? (
                <p>No audit records found.</p>
              ) : (
                auditLogs.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: "8px",
                      paddingBottom: "4px",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
