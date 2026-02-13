const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(cors());

const CHART_PATH = process.env.CHART_PATH || "./charts/woocommerce";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "127.0.0.1.nip.io";
const ENVIRONMENT = process.env.NODE_ENV || "local";
const AUDIT_FILE = path.join(__dirname, "audit.log");

const GLOBAL_MAX_STORES = 10;
const MAX_STORES_PER_USER = 3;

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
        if (cmd.includes("helm status") && stdout) {
          return resolve(stdout.trim());
        }
        return reject(stderr || err.message);
      }
      resolve(stdout.trim());
    });
  });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests, please try again later." },
});
// app.use("/api/stores", limiter);

let isProvisioning = false;

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
      line.includes("PROVISION_FAILED")
    ).length;

    res.json({
      total_stores: items.length,
      active_stores: active,
      total_failures: failures,
      max_quota: GLOBAL_MAX_STORES,
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
    const namespaces = JSON.parse(jsonOutput).items || [];
    const stores = await Promise.all(
      namespaces.map(async (ns) => {
        const name = ns.metadata.labels.storeName;
        const type = ns.metadata.labels.engine || "woocommerce";
        const owner = ns.metadata.labels.owner || "anonymous";
        let status = "Provisioning";

        try {
          const helmOutput = await runCommand(
            `helm status ${name} -n ${ns.metadata.name} -o json`
          );
          const helmInfo = JSON.parse(helmOutput).info;

          if (helmInfo.status === "deployed") status = "Ready";
          else if (helmInfo.status === "failed") status = "Failed";
          else if (helmInfo.status === "pending-install")
            status = "Provisioning";
          else status = helmInfo.status;
        } catch (e) {
          if (ns.status.phase === "Terminating") status = "Terminating";
        }

        return {
          name: name,
          type: type,
          status: status,
          url: `http://${name}.${BASE_DOMAIN}`,
          owner: owner,
          createdAt: ns.metadata.creationTimestamp,
        };
      })
    );

    res.json(stores);
  } catch (err) {
    console.error(err);
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

app.post("/api/stores", limiter, async (req, res) => {
  if (isProvisioning) {
    return res.status(429).json({
      error:
        "System busy. Another store is being provisioned. Please wait 30s.",
    });
  }

  const { storeName, storeType = "woocommerce" } = req.body;
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(400).json({ error: "Missing User Identity (x-user-id)" });
  }

  const safeName = storeName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const namespace = `store-${safeName}`;
  const dbPassword = generatePassword();

  try {
    const currentStores = await runCommand(
      `kubectl get namespaces -l type=store --no-headers | wc -l`
    );
    if (parseInt(currentStores) >= GLOBAL_MAX_STORES) {
      logAudit("PROVISION_DENIED", { reason: "Global Quota", store: safeName });
      return res.status(429).json({ error: "Platform capacity reached." });
    }
    const userStoreCount = await runCommand(
      `kubectl get namespaces -l owner=${userId} --no-headers | wc -l`
    );
    if (parseInt(userStoreCount) >= MAX_STORES_PER_USER) {
      logAudit("PROVISION_DENIED", { reason: "User Quota", user: userId });
      return res.status(403).json({
        error: `You have reached your limit of ${MAX_STORES_PER_USER} stores.`,
      });
    }
  } catch (e) {
    console.warn("Quota check warning:", e);
  }

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
    isProvisioning = true;

    const startTime = Date.now();
    logAudit("PROVISION_START", {
      store: safeName,
      type: storeType,
      user: userId,
    });
    await runCommand(
      `kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -`
    );
    await runCommand(
      `kubectl label namespace ${namespace} type=store storeName=${safeName} engine=${storeType} owner=${userId} --overwrite`
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
  } finally {
    isProvisioning = false;
  }
});

app.delete("/api/stores/:name", limiter, async (req, res) => {
  const storeName = req.params.name;
  const namespace = `store-${storeName}`;

  try {
    logAudit("DELETE_START", { store: storeName });

    try {
      await runCommand(`helm uninstall ${storeName} -n ${namespace}`);
    } catch (e) {
      console.log(
        "Helm release already gone or failed, proceeding to namespace delete"
      );
    }

    await runCommand(`kubectl delete namespace ${namespace} --wait=false`);

    logAudit("DELETE_SUCCESS", { store: storeName });
    res.json({ status: "deleted" });
  } catch (err) {
    logAudit("DELETE_FAILED", { store: storeName, error: err });
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

app.get("/api/audit", async (req, res) => {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const logs = fs.readFileSync(AUDIT_FILE, "utf8");
      const logLines = logs.trim().split("\n").reverse();
      res.json(logLines);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read audit log" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Orchestrator running on port ${PORT}`);
  console.log(`Chart path: ${CHART_PATH}`);
  console.log(`Base domain: ${BASE_DOMAIN}`);
});
