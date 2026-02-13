Readme · MD
Copy

# K8s Store Orchastration

**Kubernetes Native WooCommerce-as-a-Service**

k8s store orchastration is a multi-tenant orchestration engine that instantly provisions isolated, production-ready WooCommerce stores on Kubernetes. It abstracts away the complexity of Helm, PVCs, and Ingress behind a simple, modern dashboard.

---

## 🏗️ System Architecture

The platform consists of three core components:

1. **Frontend (React/Vite)**: A dashboard for users to manage stores and view real-time Kubernetes events
2. **Orchestrator (Node.js)**: A REST API that acts as the "Operator," managing Helm releases, namespaces, and RBAC policies
3. **Infrastructure (Helm + K8s)**: A highly modular Helm chart architecture that deploys WordPress, MariaDB, and Ingress rules per tenant, Medusa is currently stubbed but can be easily integrated

---

## 📂 Project Structure

```
urumi-platform/
├── backend/                 # Node.js Orchestrator
│   ├── server.js            # API logic, Helm execution, RBAC mgmt
│   └── Dockerfile           # Backend container
├── frontend/                # React Dashboard
│   ├── src/App.jsx          # UI Logic & State
│   └── Dockerfile           # Frontend container
├── charts/                  # Helm Charts
│   ├── platform/            # Deploys the Dashboard & Orchestrator
│   │   ├── templates/       # K8s manifests (Deployment, Service, Ingress)
│   │   └── values.yaml      # Default config
│   └── woocommerce/         # The "Product" chart for stores
│       ├── templates/       # WP + MariaDB + NetworkPolicies
│       ├── values-local.yaml # Docker Desktop config
│       └── values-prod.yaml  # AWS/k3s config
└── README.md                # This file
```

---

## Local Setup Instructions

### Prerequisites

- Docker Desktop (Enable Kubernetes in settings)
- Helm (`brew install helm` or equivalent)
- Node.js 18+

### 1. Build Docker Images

Since we use a local cluster, we build images directly to the Docker registry.

```bash
# Build Backend Orchestrator
docker build -t orchestrator:local -f backend/Dockerfile .

# Build Frontend Dashboard
docker build -t dashboard:local -f frontend/Dockerfile .
```

### 2. Deploy Platform (Local)

We use the platform chart to deploy the dashboard and orchestrator.

```bash
# Deploy to 'platform' namespace
helm upgrade --install platform ./charts/platform \
  -n platform --create-namespace \
  --values ./charts/platform/values.yaml
```

### 3. Access the Dashboard

The platform uses nip.io to map local domains automatically.

- **Dashboard**: http://dashboard.127.0.0.1.nip.io
- **API**: http://api.127.0.0.1.nip.io

---

## ☁️ Production Setup (AWS VPS + k3s)

This guide assumes an Ubuntu 24.04 LTS instance on AWS (t3.medium recommended).

### 1. VPS Configuration

SSH into your instance and install k3s (Lightweight Kubernetes):

```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 2. Transfer Images

Since k3s is remote, transfer your local images to the VPS:

```bash
# Run on your LOCAL machine
docker save orchestrator:local | ssh ubuntu@ "sudo k3s ctr images import -"
docker save dashboard:local | ssh ubuntu@ "sudo k3s ctr images import -"
```

### 3. Deploy Platform (Production)

Deploy using the production values (Traefik Ingress + Local Path Storage).

```bash
# Run on VPS
helm upgrade --install platform ./charts/platform \
  -n platform --create-namespace \
  --set ingress.baseDomain=.nip.io \
  --set ingress.className=traefik
```

**Dashboard**: http://dashboard.<AWS-IP>.nip.io

---

## 🛒 Usage Guide

### How to Create a Store

1. Open the Dashboard
2. Enter a store name (e.g., `nike-shoes`)
3. Click **"Deploy Store"**
4. Watch the "Provisioning" status pulse. The system is:
   - Creating a namespace `store-nike-shoes`
   - Creating PVCs for MySQL and WordPress
   - Generating a random database password
   - Waiting for the ReadinessProbe to pass

### How to Place an Order

1. Click **"Visit"** on the store card (URL: `http://nike-shoes.127.0.0.1.nip.io`)
2. Walk through the standard WordPress setup (English → Site Title → Admin User)
3. Install WooCommerce plugin (optional, or pre-baked in image)
4. Add a product and proceed to checkout

---

## ⚙️ Helm Configuration & Values

We use separate value files to handle environment differences without code changes.

| Feature       | values-local.yaml | values-prod.yaml | Reason                                                           |
| ------------- | ----------------- | ---------------- | ---------------------------------------------------------------- |
| Ingress Class | nginx             | traefik          | Docker Desktop uses Nginx; k3s uses Traefik by default           |
| Storage Class | hostpath          | local-path       | hostpath is simple for Mac/Windows; local-path optimized for VPS |
| Resources     | Low (256Mi)       | Medium (512Mi)   | Production stores need more RAM to handle traffic                |
| TLS/HTTPS     | false             | true             | Production uses Cert-Manager for Let's Encrypt SSL               |

---

## 🧠 System Design & Tradeoffs

### 1. Architecture Choice

**Why Helm?**  
 chose to wrap the "business logic" of a store into a Helm chart. This allows versioning, rollbacks, and atomic updates. The Node.js backend simply executes Helm commands, keeping the orchestrator stateless and simple.

**Why Namespace-per-Tenant?**  
Every store gets its own namespace (`store-<name>`). This provides hard isolation. If one store gets hacked or consumes 100% CPU, the ResourceQuota and NetworkPolicy prevent it from affecting neighbors.

### 2. Idempotency & Reliability

- **Atomic Operations**: We use the `helm upgrade --install --atomic` flag. If any part of the provision fails (e.g., DB doesn't start), Helm automatically rolls back the entire release, preventing "zombie" half-broken stores.
- **Concurrency Locks**: The backend implements a mutex lock to prevent CPU exhaustion on the VPS. Only one store can be provisioned at a time (configurable).
- **Cleanup**: The DELETE route performs a "nuclear" cleanup, removing the Helm release and the namespace to ensure no orphaned PVCs or Secrets remain.

### 3. Production Readiness

**Security:**

- **RBAC**: The Orchestrator uses a ServiceAccount with strictly scoped permissions (managing only namespaces/deployments), not cluster-admin
- **Network Policies**: By default, stores cannot talk to each other

**Observability:**  
The dashboard streams real-time Kubernetes events (Warning, Normal) directly to the user, providing transparency on "Why is my store taking so long?" (e.g., Pulling Images)

---
