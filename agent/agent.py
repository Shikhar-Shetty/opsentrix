import os
import time
import psutil
import socketio
import subprocess
import threading
from fastapi import FastAPI
import uvicorn
import json
import socket
import requests

# ---------- ENV ----------
AGENT_NAME = os.getenv("AGENT_NAME", "agt_dd104ead27ed")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "tok_855d4c314b09d97299618165")
BACKEND_URL = os.getenv("BACKEND_URL", "https://opsentrix.onrender.com/")
AGENT_PORT = int(os.getenv("AGENT_PORT", 10000))
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", 10))
AGENT_HOST_IP = os.getenv("AGENT_HOST_IP", None)

# NEW: Allow external port override (for port mapping scenarios)
AGENT_EXTERNAL_PORT = int(os.getenv("AGENT_EXTERNAL_PORT", AGENT_PORT))

# ---------- Socket.IO ----------
sio = socketio.Client(reconnection=True, reconnection_attempts=0)

@sio.event
def connect():
    print("[+] Connected to backend")

@sio.event
def disconnect():
    print("[-] Disconnected from backend")

# ---------- Host IP Detection ----------
def get_host_ip():
    """
    Detects the accessible IP address of the host machine.
    """
    if AGENT_HOST_IP:
        print(f"[IP] Using manual override: {AGENT_HOST_IP}")
        return AGENT_HOST_IP
    
    try:
        response = requests.get('https://api.ipify.org?format=json', timeout=3)
        if response.status_code == 200:
            public_ip = response.json()['ip']
            print(f"[IP] Detected public IP: {public_ip}")
            return public_ip
    except Exception as e:
        print(f"[IP] Could not fetch public IP: {e}")
    
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        print(f"[IP] Detected local IP: {local_ip}")
        return local_ip
    except Exception as e:
        print(f"[IP] Could not detect local IP: {e}")
    
    print("[IP] Falling back to localhost")
    return "localhost"

HOST_IP = get_host_ip()

# ---------- Metrics ----------
def get_metrics():
    return {
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "CPU": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "port": AGENT_EXTERNAL_PORT,  # CHANGED: Report the external/mapped port
        "hostIp": HOST_IP,
        "processes": len(psutil.pids()),
        "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

def send_metrics_loop():
    while True:
        try:
            if not sio.connected:
                sio.connect(BACKEND_URL)
        except Exception as e:
            print("[!] Socket.IO connection failed:", e)
            time.sleep(5)
            continue
        
        metrics = get_metrics()
        print("[>] Sending metrics:", metrics)
        
        try:
            sio.emit("agent_metrics", metrics)
        except Exception as e:
            print("[!] Failed to emit metrics:", e)
        
        time.sleep(METRICS_INTERVAL)

# ---------- Cleanup ----------
def run_cleanup():
    """Runs cleanup.sh safely and returns structured JSON"""
    script_path = os.path.join(os.getcwd(), "cleanup.sh")
    
    if not os.path.isfile(script_path):
        return {"status": "error", "output": "cleanup.sh not found"}
    
    try:
        result = subprocess.run(
            ["bash", script_path],
            capture_output=True,
            text=True,
            check=True
        )
        print("[Cleanup] Success:\n", result.stdout)
        
        last_line = result.stdout.strip().split("\n")[-1]
        try:
            output_json = json.loads(last_line)
        except json.JSONDecodeError:
            output_json = {"status": "success", "output": result.stdout}
        
        return output_json
    except subprocess.CalledProcessError as e:
        print("[Cleanup] Error:\n", e.stderr)
        return {"status": "error", "output": e.stderr}

# ---------- FastAPI ----------
app = FastAPI(title="Opsentrix Agent API")

@app.post("/cleanup")
async def cleanup_endpoint():
    return run_cleanup()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agentId": AGENT_NAME,
        "hostIp": HOST_IP,
        "internalPort": AGENT_PORT,
        "externalPort": AGENT_EXTERNAL_PORT
    }

@app.get("/diagnostics")
async def diagnostics():
    return {
        "agentId": AGENT_NAME,
        "hostIp": HOST_IP,
        "internalPort": AGENT_PORT,
        "externalPort": AGENT_EXTERNAL_PORT,
        "backendUrl": BACKEND_URL,
        "isConnectedToBackend": sio.connected,
        "publicAccessUrl": f"http://{HOST_IP}:{AGENT_EXTERNAL_PORT}",
        "message": "If you can see this, your agent is running correctly!"
    }

# ---------- MAIN ----------
if __name__ == "__main__":
    psutil.cpu_percent(interval=1)
    
    print(f"[Agent] Starting {AGENT_NAME}")
    print(f"[Agent] Detected Host IP: {HOST_IP}")
    print(f"[Agent] Internal Port: {AGENT_PORT}")
    print(f"[Agent] External Port: {AGENT_EXTERNAL_PORT}")
    print(f"[Agent] Backend URL: {BACKEND_URL}")
    print(f"")
    print(f"✅ Agent accessible at: http://{HOST_IP}:{AGENT_EXTERNAL_PORT}")
    print(f"⚠️  Make sure port {AGENT_EXTERNAL_PORT} is open!")
    print(f"")
    
    threading.Thread(target=send_metrics_loop, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=AGENT_PORT, log_level="info")