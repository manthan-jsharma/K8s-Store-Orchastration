const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const CHART_PATH = process.env.CHART_PATH || "./charts/woocommerce";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "127.0.0.1.nip.io";
const ENVIRONMENT = process.env.NODE_ENV || "local";

const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error executing: ${cmd}`, stderr);
        reject(stderr || err.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });

app.get("/stores", async (req, res) => {
  try {
    const jsonOutput = await runCommand(
      `kubectl get namespaces -l type=store -o json`
    );
    const namespaces = JSON.parse(jsonOutput).items;

    const stores = namespaces.map((ns) => {
      const name = ns.metadata.labels.storeName;
      const status = ns.status.phase === "Active" ? "Ready" : "Terminating";
      return {
        name: name,
        type: ns.metadata.labels.engine || "woocommerce",
        status: status,
        url: `http://${name}.${BASE_DOMAIN}`,
        createdAt: ns.metadata.creationTimestamp,
      };
    });

    res.json(stores);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

app.post("/stores", async (req, res) => {
  const { storeName, storeType = "woocommerce" } = req.body;
  const safeName = storeName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const namespace = `store-${safeName}`;

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
    --values ${chart}/${valuesFile} \
    --wait --timeout 5m
  `;

  try {
    console.log(`[Provisioning] Starting creation of ${safeName}...`);

    await runCommand(cmd);

    await runCommand(
      `kubectl label namespace ${namespace} type=store storeName=${safeName} engine=${storeType} --overwrite`
    );

    res.json({ status: "success", url: `http://${safeName}.${BASE_DOMAIN}` });
  } catch (err) {
    console.error("Provisioning failed:", err);
    res.status(500).json({ error: "Provisioning failed", details: err });
  }
});

app.delete("/stores/:name", async (req, res) => {
  const storeName = req.params.name;
  const namespace = `store-${storeName}`;

  try {
    console.log(`[Teardown] Deleting ${storeName}...`);
    await runCommand(`helm uninstall ${storeName} -n ${namespace}`);
    await runCommand(`kubectl delete namespace ${namespace}`);
    res.json({ status: "deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

app.listen(3000, () => console.log("Orchestrator running on port 3000"));
