const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(cors());

const CHART_PATH = process.env.CHART_PATH || "./charts/woocommerce";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "127.0.0.1.nip.io";
const ENVIRONMENT = process.env.NODE_ENV || "local";
const MAX_STORES = 5;
const AUDIT_FILE = path.join(__dirname, "audit.log");
const generatePassword = () => Math.random().toString(36).slice(-8) + "X!1";

const logAudit = (action, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ACTION: ${action} | DETAILS: ${JSON.stringify(
    details
  )}\n`;
  console.log(logEntry.trim());
  fs.appendFile(AUDIT_FILE, logEntry, (err) => {
    if (err) console.error("Failed to write audit log:", err);
  });
};

const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });

app.get("/api/stats", async (req, res) => {
  try {
    const jsonOutput = await runCommand(
      `kubectl get namespaces -l type=store -o json`
    );
    const items = JSON.parse(jsonOutput).items || [];
    const active = items.filter((ns) => ns.status.phase === "Active").length;

    const auditLogs = fs.existsSync(AUDIT_FILE)
      ? fs.readFileSync(AUDIT_FILE, "utf8").split("\n")
      : [];
    const failures = auditLogs.filter((line) =>
      line.includes("Provisioning Failed")
    ).length;

    res.json({
      total_stores: items.length,
      active_stores: active,
      total_failures: failures,
      max_quota: MAX_STORES,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/stores", async (req, res) => {
  try {
    const jsonOutput = await runCommand(
      `kubectl get namespaces -l type=store -o json`
    );
    const namespaces = JSON.parse(jsonOutput).items;

    const stores = namespaces.map((ns) => ({
      name: ns.metadata.labels.storeName,
      type: ns.metadata.labels.engine || "woocommerce",
      status: ns.status.phase === "Active" ? "Ready" : "Terminating",
      url: `http://${ns.metadata.labels.storeName}.${BASE_DOMAIN}`,
      createdAt: ns.metadata.creationTimestamp,
    }));

    res.json(stores);
  } catch (err) {
    res.json([]);
  }
});

app.get("/api/stores/:name/events", async (req, res) => {
  const namespace = `store-${req.params.name}`;
  try {
    const events = await runCommand(
      `kubectl get events -n ${namespace} --sort-by='.lastTimestamp' -o json`
    );
    res.json(JSON.parse(events).items);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch events" });
  }
});

app.post("/api/stores", async (req, res) => {
  const { storeName, storeType = "woocommerce" } = req.body;
  const safeName = storeName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const namespace = `store-${safeName}`;
  const dbPassword = generatePassword();

  try {
    const currentStores = await runCommand(
      `kubectl get namespaces -l type=store --no-headers | wc -l`
    );
    if (parseInt(currentStores) >= MAX_STORES) {
      logAudit("PROVISION_DENIED", {
        reason: "Quota Exceeded",
        store: safeName,
      });
      return res.status(429).json({ error: "Global store quota exceeded." });
    }
  } catch (e) {}

  const valuesFile =
    ENVIRONMENT === "production" ? "values-prod.yaml" : "values-local.yaml";
  const chart =
    storeType === "medusa" ? "./charts/medusa" : "./charts/woocommerce";

  const cmd = `
    helm upgrade --install ${safeName} ${chart} \
    --namespace ${namespace} \
    --create-namespace \
    --set storeName=${safeName} \
    --set baseDomain=${BASE_DOMAIN} \
    --set mysql.rootPassword=${dbPassword} \
    --set wordpress.dbPassword=${dbPassword} \
    --values ${chart}/${valuesFile} \
    --atomic \
    --wait --timeout 5m
  `;

  try {
    const startTime = Date.now();
    logAudit("PROVISION_START", { store: safeName, type: storeType });

    await runCommand(
      `kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -`
    );
    await runCommand(
      `kubectl label namespace ${namespace} type=store storeName=${safeName} engine=${storeType} --overwrite`
    );

    await runCommand(cmd);

    const duration = (Date.now() - startTime) / 1000;
    logAudit("PROVISION_SUCCESS", {
      store: safeName,
      duration: `${duration}s`,
    });

    res.json({ status: "success", url: `http://${safeName}.${BASE_DOMAIN}` });
  } catch (err) {
    const errorReason = err.includes("timed out")
      ? "Kubernetes Timeout"
      : err.split("\n").pop();
    logAudit("PROVISION_FAILED", { store: safeName, reason: errorReason });
    console.error("Provisioning failed:", err);

    res
      .status(500)
      .json({ error: "Provisioning failed", details: errorReason });
  }
});

app.delete("/api/stores/:name", async (req, res) => {
  const storeName = req.params.name;
  const namespace = `store-${storeName}`;

  try {
    logAudit("DELETE_START", { store: storeName });
    await runCommand(`helm uninstall ${storeName} -n ${namespace}`);
    await runCommand(`kubectl delete namespace ${namespace}`);
    logAudit("DELETE_SUCCESS", { store: storeName });
    res.json({ status: "deleted" });
  } catch (err) {
    logAudit("DELETE_FAILED", { store: storeName, error: err });
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

app.listen(3000, () => console.log("Orchestrator running on port 3000"));
