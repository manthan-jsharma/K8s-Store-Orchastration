import React, { useState, useEffect } from "react";
import {
  Store,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Code,
  Server,
  ShoppingBag,
} from "lucide-react";
import { getStores, createStore, deleteStore } from "./api";
import "./App.css";

function App() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [newStoreName, setNewStoreName] = useState("");
  const [storeType, setStoreType] = useState("woocommerce");

  const fetchStores = async () => {
    try {
      const res = await getStores();
      if (Array.isArray(res.data)) {
        setStores(res.data);
      } else {
        console.warn("API returned invalid format:", res.data);
        setStores([]);
      }
    } catch (err) {
      console.error("Failed to fetch stores", err);
      setStores([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStoreName) return;

    setLoading(true);
    try {
      await createStore({
        storeName: newStoreName.toLowerCase().replace(/\s+/g, "-"),
        storeType,
      });
      setNewStoreName("");
      fetchStores();
    } catch (err) {
      alert(err.response?.data?.error || "Provisioning Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name) => {
    if (
      !window.confirm(
        `Are you sure you want to destroy ${name}? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteStore(name);
      setStores(stores.filter((s) => s.name !== name));
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="app-container">
      {}
      <aside className="sidebar">
        <div className="brand">
          <Server size={24} color="#3b82f6" />
          <span>Urumi Platform</span>
        </div>
        <nav>
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <Store size={18} /> Stores
          </button>
          <button
            className={activeTab === "developer" ? "active" : ""}
            onClick={() => setActiveTab("developer")}
          >
            <Code size={18} /> Developer SDK
          </button>
        </nav>
      </aside>

      {}
      <main className="content">
        {activeTab === "dashboard" ? (
          <>
            <header className="header">
              <h1>Store Orchestration</h1>
              <button className="refresh-btn" onClick={fetchStores}>
                <RefreshCw size={16} /> Refresh
              </button>
            </header>

            {}
            <div className="create-card">
              <h2>Provision New Instance</h2>
              <form onSubmit={handleCreate} className="create-form">
                <div className="input-group">
                  <label>Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g. viral-video-merch"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Engine</label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                  >
                    <option value="woocommerce">WooCommerce (Wordpress)</option>
                    <option value="medusa">MedusaJS (Headless Node)</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="deploy-btn">
                  {loading ? (
                    "Provisioning..."
                  ) : (
                    <>
                      <Plus size={16} /> Deploy Store
                    </>
                  )}
                </button>
              </form>
            </div>

            {}
            <div className="stores-grid">
              {stores.length === 0 ? (
                <div className="empty-state">
                  No stores active. Deploy one above.
                </div>
              ) : (
                stores.map((store) => (
                  <div key={store.name} className="store-card">
                    <div className="store-header">
                      <div className="store-icon">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <h3>{store.name}</h3>
                        <span className={`badge ${store.status || "unknown"}`}>
                          {store.status || "RUNNING"}
                        </span>
                      </div>
                    </div>

                    <div className="store-details">
                      <p>
                        <strong>Engine:</strong> {store.type || "WooCommerce"}
                      </p>
                      <p>
                        <strong>URL:</strong>{" "}
                        <a href={store.url} target="_blank" rel="noreferrer">
                          {store.url}
                        </a>
                      </p>
                    </div>

                    <div className="store-actions">
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noreferrer"
                        className="action-btn view"
                      >
                        <ExternalLink size={14} /> Visit
                      </a>
                      <button
                        onClick={() => handleDelete(store.name)}
                        className="action-btn delete"
                      >
                        <Trash2 size={14} /> Terminate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="developer-section">
            <h1>Developer Integration</h1>
            <p>
              Integrate Urumi Store Provisioning into your Reel Video Editor.
            </p>

            <div className="code-block">
              <h3>1. Import the SDK</h3>
              <pre>
                {`<script src="https://${window.location.hostname}/sdk/urumi.js"></script>`}
              </pre>
            </div>

            <div className="code-block">
              <h3>2. Provision a Store for a Video</h3>
              <pre>
                {`const urumi = new Urumi({ 
  apiUrl: 'http://${window.location.hostname}:3000' 
});

// Trigger this when user clicks "Monetize Video"
urumi.createStoreForVideo('My Viral Video', (data) => {
  console.log('Store Created:', data.url);
});`}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
