const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const client = require("prom-client");
const fs = require("fs");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  })
);

const CHART_PATH = process.env.CHART_PATH || "/app/charts/store-chart";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "127.0.0.1.nip.io";

const register = new client.Registry();
const storeCounter = new client.Counter({
  name: "stores_created_total",
  help: "Total stores created",
});
register.registerMetric(storeCounter);

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Rate limit exceeded. Please try again later.",
});

const log = (msg) => {
  const entry = `${new Date().toISOString()} | ${msg}\n`;
  fs.appendFileSync("/tmp/audit.log", entry);
  console.log(msg);
};

const runHelm = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(stderr);
      else resolve(stdout);
    });
  });

const STORE_ENGINES = {
  woocommerce: process.env.CHART_PATH_WOO || "./charts/woocommerce",
  medusa: process.env.CHART_PATH_MEDUSA || "./charts/medusa",
};

app.post("/stores", createLimiter, async (req, res) => {
  const { storeName, storeType = "woocommerce" } = req.body;

  if (!/^[a-z0-9-]+$/.test(storeName))
    return res.status(400).json({ error: "Invalid Name" });
  if (!STORE_ENGINES[storeType])
    return res
      .status(400)
      .json({ error: "Invalid Store Type. Use 'woocommerce' or 'medusa'" });

  const namespace = `ns-${storeName}`;
  const dbPass = Math.random().toString(36).slice(-12);
  const chartPath = STORE_ENGINES[storeType];

  let setValues = `--set storeName=${storeName} --set baseDomain=${BASE_DOMAIN}`;

  if (storeType === "woocommerce") {
    setValues += ` --set mysql.rootPassword=${dbPass}`;
  } else if (storeType === "medusa") {
    setValues += ` --set postgres.password=${dbPass}`;
  }

  const cmd = `helm upgrade --install ${storeName} ${chartPath} \
        --namespace ${namespace} \
        --create-namespace \
        --atomic \
        --timeout 8m \
        ${setValues}`;

  try {
    log(`Provisioning ${storeType} store: ${storeName}`);
    await runHelm(cmd);
    storeCounter.inc({ type: storeType });
    const port = storeType === "medusa" ? 9000 : 80;

    res.json({
      status: "ready",
      type: storeType,
      url: `http://${storeName}.${BASE_DOMAIN}`,
      admin_details: {
        user: storeType === "medusa" ? "admin@medusa-test.com" : "admin",
        password: "password",
      },
    });
  } catch (err) {
    log(`Failed: ${err}`);
    res.status(500).json({ error: "Provisioning failed", details: err });
  }
});
