// import React, { useState, useEffect } from "react";
// import {
//   Store,
//   Trash2,
//   ExternalLink,
//   Plus,
//   RefreshCw,
//   Code,
//   Server,
//   ShoppingBag,
// } from "lucide-react";
// import { getStores, createStore, deleteStore } from "./api";
// import "./App.css";

// function App() {
//   const [stores, setStores] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("dashboard");

//   const [newStoreName, setNewStoreName] = useState("");
//   const [storeType, setStoreType] = useState("woocommerce");

//   const fetchStores = async () => {
//     try {
//       const res = await getStores();
//       if (Array.isArray(res.data)) {
//         setStores(res.data);
//       } else {
//         console.warn("API returned invalid format:", res.data);
//         setStores([]);
//       }
//     } catch (err) {
//       console.error("Failed to fetch stores", err);
//       setStores([]);
//     }
//   };

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     if (!newStoreName) return;

//     setLoading(true);
//     try {
//       await createStore({
//         storeName: newStoreName.toLowerCase().replace(/\s+/g, "-"),
//         storeType,
//       });
//       setNewStoreName("");
//       fetchStores();
//     } catch (err) {
//       alert(err.response?.data?.error || "Provisioning Failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (name) => {
//     if (
//       !window.confirm(
//         `Are you sure you want to destroy ${name}? This cannot be undone.`
//       )
//     )
//       return;
//     try {
//       await deleteStore(name);
//       setStores(stores.filter((s) => s.name !== name));
//     } catch (err) {
//       alert("Delete failed");
//     }
//   };

//   return (
//     <div className="app-container">
//       {}
//       <aside className="sidebar">
//         <div className="brand">
//           <Server size={24} color="#3b82f6" />
//           <span>Urumi Platform</span>
//         </div>
//         <nav>
//           <button
//             className={activeTab === "dashboard" ? "active" : ""}
//             onClick={() => setActiveTab("dashboard")}
//           >
//             <Store size={18} /> Stores
//           </button>
//           <button
//             className={activeTab === "developer" ? "active" : ""}
//             onClick={() => setActiveTab("developer")}
//           >
//             <Code size={18} /> Developer SDK
//           </button>
//         </nav>
//       </aside>

//       {}
//       <main className="content">
//         {activeTab === "dashboard" ? (
//           <>
//             <header className="header">
//               <h1>Store Orchestration</h1>
//               <button className="refresh-btn" onClick={fetchStores}>
//                 <RefreshCw size={16} /> Refresh
//               </button>
//             </header>

//             {}
//             <div className="create-card">
//               <h2>Provision New Instance</h2>
//               <form onSubmit={handleCreate} className="create-form">
//                 <div className="input-group">
//                   <label>Store Name</label>
//                   <input
//                     type="text"
//                     placeholder="e.g. viral-video-merch"
//                     value={newStoreName}
//                     onChange={(e) => setNewStoreName(e.target.value)}
//                   />
//                 </div>
//                 <div className="input-group">
//                   <label>Engine</label>
//                   <select
//                     value={storeType}
//                     onChange={(e) => setStoreType(e.target.value)}
//                   >
//                     <option value="woocommerce">WooCommerce (Wordpress)</option>
//                     <option value="medusa">MedusaJS (Headless Node)</option>
//                   </select>
//                 </div>
//                 <button type="submit" disabled={loading} className="deploy-btn">
//                   {loading ? (
//                     "Provisioning..."
//                   ) : (
//                     <>
//                       <Plus size={16} /> Deploy Store
//                     </>
//                   )}
//                 </button>
//               </form>
//             </div>

//             {}
//             <div className="stores-grid">
//               {stores.length === 0 ? (
//                 <div className="empty-state">
//                   No stores active. Deploy one above.
//                 </div>
//               ) : (
//                 stores.map((store) => (
//                   <div key={store.name} className="store-card">
//                     <div className="store-header">
//                       <div className="store-icon">
//                         <ShoppingBag size={20} />
//                       </div>
//                       <div>
//                         <h3>{store.name}</h3>
//                         <span className={`badge ${store.status || "unknown"}`}>
//                           {store.status || "RUNNING"}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="store-details">
//                       <p>
//                         <strong>Engine:</strong> {store.type || "WooCommerce"}
//                       </p>
//                       <p>
//                         <strong>URL:</strong>{" "}
//                         <a href={store.url} target="_blank" rel="noreferrer">
//                           {store.url}
//                         </a>
//                       </p>
//                     </div>

//                     <div className="store-actions">
//                       <a
//                         href={store.url}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="action-btn view"
//                       >
//                         <ExternalLink size={14} /> Visit
//                       </a>
//                       <button
//                         onClick={() => handleDelete(store.name)}
//                         className="action-btn delete"
//                       >
//                         <Trash2 size={14} /> Terminate
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </>
//         ) : (
//           <div className="developer-section">
//             <h1>Developer Integration</h1>
//             <p>
//               Integrate Urumi Store Provisioning into your Reel Video Editor.
//             </p>

//             <div className="code-block">
//               <h3>1. Import the SDK</h3>
//               <pre>
//                 {`<script src="https://${window.location.hostname}/sdk/urumi.js"></script>`}
//               </pre>
//             </div>

//             <div className="code-block">
//               <h3>2. Provision a Store for a Video</h3>
//               <pre>
//                 {`const urumi = new Urumi({
//   apiUrl: 'http://${window.location.hostname}:3000'
// });

// // Trigger this when user clicks "Monetize Video"
// urumi.createStoreForVideo('My Viral Video', (data) => {
//   console.log('Store Created:', data.url);
// });`}
//               </pre>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const storesRes = await axios.get(`${API_URL}/api/stores`);
      const statsRes = await axios.get(`${API_URL}/api/stats`);
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
      await axios.post(`${API_URL}/api/stores`, { storeName: newStoreName });
      setNewStoreName("");
      fetchData();
    } catch (err) {
      alert(`Failed: ${err.response?.data?.details || err.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const deleteStore = async (name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await axios.delete(`${API_URL}/api/stores/${name}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete store");
    }
  };

  const viewLogs = async (name) => {
    setSelectedStore(name);
    try {
      const res = await axios.get(`${API_URL}/api/stores/${name}/events`);
      setLogs(res.data);
    } catch (err) {
      setLogs([{ message: "Could not fetch logs. Store might be deleting." }]);
    }
  };

  const closeLogs = () => {
    setSelectedStore(null);
    setLogs([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Platform Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          padding: "10px",
          background: "#f4f4f4",
          borderRadius: "8px",
        }}
      >
        <div>
          <strong>Total Stores:</strong> {stats.total_stores}
        </div>
        <div>
          <strong>Active:</strong> {stats.active_stores}
        </div>
        <div style={{ color: "red" }}>
          <strong>Failures:</strong> {stats.total_failures}
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter store name (e.g. nike-shop)"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", width: "250px" }}
        />
        <button
          onClick={createStore}
          disabled={isProvisioning}
          style={{
            padding: "8px 16px",
            background: isProvisioning ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isProvisioning ? "Provisioning..." : "Launch Store"}
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>Store Name</th>
            <th style={{ padding: "10px" }}>URL</th>
            <th style={{ padding: "10px" }}>Status</th>
            <th style={{ padding: "10px" }}>Observability</th>
            <th style={{ padding: "10px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.name} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px" }}>{store.name}</td>
              <td style={{ padding: "10px" }}>
                <a href={store.url} target="_blank" rel="noopener noreferrer">
                  {store.url}
                </a>
              </td>
              <td style={{ padding: "10px" }}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "white",
                    backgroundColor:
                      store.status === "Ready" ? "green" : "orange",
                  }}
                >
                  {store.status}
                </span>
              </td>
              <td style={{ padding: "10px" }}>
                <button
                  onClick={() => viewLogs(store.name)}
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "1px solid #555",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  📜 View K8s Events
                </button>
              </td>
              <td style={{ padding: "10px" }}>
                <button
                  onClick={() => deleteStore(store.name)}
                  style={{
                    background: "red",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedStore && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h3>Live Events: {selectedStore}</h3>
              <button onClick={closeLogs} style={{ cursor: "pointer" }}>
                Close
              </button>
            </div>
            <div
              style={{
                background: "#222",
                color: "#0f0",
                padding: "10px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {logs.length === 0 ? (
                <p>No events found yet...</p>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: "5px",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    <span style={{ color: "#888" }}>
                      [{new Date(log.lastTimestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: log.type === "Warning" ? "red" : "#0f0",
                      }}
                    >
                      {" "}
                      {log.reason}
                    </span>
                    :<span> {log.message}</span>
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
