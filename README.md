# K8s Store Orchastration Platform: WooCommerce-as-a-Service/Medusa-as-a-service

K8s Store Orchastration Platform is a Kubernetes-native Orchestrator that provisions isolated, production-ready WooCommerce stores on-demand. It uses Helm for package management and Kubernetes primitives (Namespaces, NetworkPolicies, Quotas) for multi-tenant isolation.

---

## 🏗️ System Architecture

**Stack:**

- **Frontend:** React.js (Dashboard for managing stores)
- **Backend:** Node.js / Express (Orchestrator)
- **Infrastructure:** Kubernetes (Docker Desktop for Local, k3s for Prod)
- **Provisioning:** Helm Charts (Dynamic injection of values)

**Flow:**

1.  User clicks "Launch Store" on Dashboard.
2.  Orchestrator generates unique credentials and runs `helm upgrade --install --atomic`.
3.  Kubernetes creates a dedicated Namespace (`store-nike`).
4.  Ingress Controller routes traffic to `nike.127.0.0.1.nip.io`.

---

## 🛠️ Local Setup Instructions

**Prerequisites:**

- Docker Desktop (Kubernetes enabled)
- Node.js (v16+)
- Helm (v3+)

**1. Clone & Install Dependencies**

```bash
git clone <repo-url>
cd victory-platform

cd backend && npm install

cd ../frontend && npm install

2. Build Docker Images
Since we are running locally, we build images directly into the Docker daemon.

Bash
docker build -t orchestrator:local -f backend/Dockerfile .
3. Deploy the Platform
Deploy the Orchestrator and Dashboard to the cluster.

Bash
# From project root
kubectl create namespace platform
helm install platform ./charts/platform
4. Access the Dashboard

Frontend: http://localhost:3000 (Forwarded via Node)

Orchestrator API: http://localhost:3000/api

☁️ Production Setup (AWS VPS + k3s)
1. Infrastructure Provisioning

Launch an AWS EC2 Instance (Ubuntu 24.04, t3.medium or t3.small).

Allow Inbound Traffic: ports 22 (SSH), 80 (HTTP), 443 (HTTPS).

2. Install Kubernetes (k3s)
SSH into the server and run:

Bash
curl -sfL [https://get.k3s.io](https://get.k3s.io) | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
3. Deploy the Platform
Copy your code to the server, then run:

Bash
# 1. Install Helm
curl [https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3](https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3) | bash

# 2. Build Image (requires docker installed on VPS)
docker build -t orchestrator:local -f backend/Dockerfile .
docker save orchestrator:local | sudo k3s ctr images import -

# 3. Deploy using Production Values
helm install platform ./charts/platform
🛒 How to Use
Create a Store:

Open the Dashboard.

Enter a store name (e.g., nike).

Click "Launch Store".

Wait for the status to turn Green (Ready).

Click the URL (e.g., http://nike.127.0.0.1.nip.io).

Place an Order:

Go to the Store URL.

Add "Test Product" to cart.

Checkout using Cash on Delivery.

Verify the order in /wp-admin


⚙️ Configuration (Local vs. Prod)We handle environment differences using Helm Value files.Featurevalues-local.yamlvalues-prod.yamlDomain127.0.0.1.nip.io<Your-AWS-IP>.nip.ioIngress Classnginx (Docker Desktop default)traefik (k3s default)Storage Classhostpathlocal-pathResourcesLow (CPU: 100m)High (CPU: 500m)


📝 System Design & Tradeoffs
1. Architecture Choice: Helm over Operators
Decision: We chose a Helm-based Orchestrator instead of writing a custom Kubernetes Operator.
Tradeoff: * Pros: Simpler to implement, easy to debug, standard templating language.

Cons: Less "reactive" than an Operator (doesn't automatically fix drift if someone manually deletes a pod).

Mitigation: We implemented Idempotency in the backend API to allow safe retries.

2. Idempotency & Failure Handling
Atomic Operations: We use helm upgrade --install --atomic. If a deployment fails (e.g., image pull error), Helm automatically rolls back the release, preventing "zombie" resources.

Retry Safe: The provision endpoint can be called multiple times for the same store name without causing errors or duplicate databases.

3. Security & Isolation
Namespace Isolation: Each store gets its own Namespace (store-<name>).

Network Policies: A deny-all policy blocks traffic between stores. Only Ingress (port 80) and internal DNS are allowed.

Resource Quotas: Each store is capped at 1GB RAM / 1 CPU to prevent "Noisy Neighbor" issues.

Secret Management: Database passwords are generated dynamically by the Orchestrator and injected into Helm at runtime. They are never stored in git.

4. Clean Teardown
Approach: Deleting a store triggers a "Nuclear Option."

Execution: helm uninstall followed by kubectl delete namespace. This ensures PVCs, Secrets, and ConfigMaps are completely removed, freeing up cluster resources immediately.
```
