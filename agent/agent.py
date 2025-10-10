import os
import time
import psutil
import socketio
import subprocess
import threading
from fastapi import FastAPI
import uvicorn
import json

# ---------- ENV ----------
AGENT_NAME = os.getenv("AGENT_NAME", "agt_dd104ead27ed")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "tok_855d4c314b09d97299618165")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
AGENT_PORT = int(os.getenv("AGENT_PORT", 5000))
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", 10))

# ---------- Socket.IO ----------
sio = socketio.Client(reconnection=True, reconnection_attempts=0)

@sio.event
def connect():
    print("[+] Connected to backend")

@sio.event
def disconnect():
    print("[-] Disconnected from backend")

# ---------- Metrics ----------
def get_metrics():
    return {
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "CPU": psutil.cpu_percent(interval=1),  # Changed: Use 1 second interval
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
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

        # Only take the last line (the JSON) for frontend
        last_line = result.stdout.strip().split("\n")[-1]

        try:
            output_json = json.loads(last_line)
        except json.JSONDecodeError:
            # Fallback if parsing fails
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

# ---------- MAIN ----------
if __name__ == "__main__":
    # Initialize CPU monitoring - first call returns 0, so we discard it
    psutil.cpu_percent(interval=1)
    
    # Start metrics loop in background
    threading.Thread(target=send_metrics_loop, daemon=True).start()

    # Start FastAPI
    uvicorn.run(app, host="0.0.0.0", port=AGENT_PORT, log_level="info")