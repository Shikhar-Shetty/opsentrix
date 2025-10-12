### ⚙️ Opsentrix — Real-Time Infrastructure Intelligence & Response Framework

**Opsentrix** is a distributed monitoring and response framework built for modern infrastructure environments.  
It enables teams to deploy lightweight, Dockerized agents across multiple systems, stream live performance metrics, and execute response actions directly from a unified dashboard.  

Designed for scalability and control, Opsentrix offers a seamless pipeline between **Python-based agents**, a **Node.js backend**, and a **Next.js analytics dashboard**, powered by **Prisma + PostgreSQL**.  

---

### 🧭 Overview

Opsentrix provides a robust foundation for **system observability** and **operational response**.  
Its agent-driven architecture ensures real-time visibility into every connected node, with live metric streaming and command execution.

### Core Objectives
- Deliver accurate, low-latency monitoring across distributed systems.  
- Provide immediate feedback loops through real-time dashboards.  
- Establish the groundwork for automated incident response pipelines.  

---

### 🧩 System Architecture

```text
+-------------------------------+
|  Next.js Frontend Dashboard   |
|  • Displays real-time metrics |
|  • Shows AI-driven insights   |
|  • Executes response actions  |
+---------------┬---------------+
                │  (Socket.IO)
                ▼
+-------------------------------+
|  Node.js Backend (API Server) |
|  • Manages agent connections  |
|  • Relays metrics to frontend |
|  • Persists data via Prisma   |
+---------------┬---------------+
                │  (Socket.IO)
                ▼
+-------------------------------+
|  Python Agent (Dockerized)    |
|  • Collects CPU, RAM, Disk... |
|  • Sends live metrics         |
|  • Handles command execution  |
+-------------------------------+
```

Each agent communicates securely with the backend using Socket.IO, maintaining persistent connectivity even in private subnet NAT-backed environments. :D