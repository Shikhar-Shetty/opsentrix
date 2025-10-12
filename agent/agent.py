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
BACKEND_URL = os.getenv("BACKEND_URL", "https://opsentrix.onrender.com/")
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", 10))

# ---------- Socket.IO Client ----------
sio = socketio.Client(reconnection=True, reconnection_attempts=0)

@sio.event
def connect():
    print("[+] Connected to backend")
    # Register agent immediately
    sio.emit("register_agent", {
        "id": AGENT_NAME,
        "token": AGENT_TOKEN
    })

@sio.event
def disconnect():
    print("[-] Disconnected from backend")

@sio.event
def cleanup_command(data):
    """
    Backend sends cleanup command via Socket.IO
    No HTTP needed, no ports exposed!
    """
    print("[Socket.IO] Received cleanup command:", data)
    
    # Run cleanup
    result = run_cleanup()
    
    # Send result back via Socket.IO
    sio.emit("cleanup_response", {
        "agentId": AGENT_NAME,
        "requestId": data.get("requestId"),  # Track which request this is for
        "result": result
    })
    
    print("[Socket.IO] Cleanup response sent")

# ---------- Cleanup Function ----------
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
            check=True,
            timeout=30  # Add timeout
        )
        print("[Cleanup] Success:\n", result.stdout)
        
        # Try to parse last line as JSON
        last_line = result.stdout.strip().split("\n")[-1] if result.stdout else ""
        try:
            output_json = json.loads(last_line)
        except json.JSONDecodeError:
            output_json = {"status": "success", "output": result.stdout}
        
        return output_json
    except subprocess.TimeoutExpired:
        print("[Cleanup] Timeout")
        return {"status": "error", "output": "Cleanup script timeout"}
    except subprocess.CalledProcessError as e:
        print("[Cleanup] Error:\n", e.stderr)
        return {"status": "error", "output": e.stderr or "Unknown error"}

# ---------- Metrics ----------
def get_metrics():
    return {
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "CPU": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "processes": len(psutil.pids()),
        "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

def send_metrics_loop():
    """Continuously send metrics via Socket.IO"""
    while True:
        # Ensure connected
        if not sio.connected:
            try:
                print("[>] Connecting to backend...")
                sio.connect(BACKEND_URL)
                time.sleep(2)  # Wait for connection
            except Exception as e:
                print(f"[!] Connection failed: {e}")
                time.sleep(5)
                continue
        
        # Send metrics
        metrics = get_metrics()
        print(f"[>] Sending metrics: CPU={metrics['CPU']:.1f}% MEM={metrics['memory']:.1f}%")
        
        try:
            sio.emit("agent_metrics", metrics)
        except Exception as e:
            print(f"[!] Failed to emit metrics: {e}")
        
        time.sleep(METRICS_INTERVAL)

# ---------- Optional FastAPI for local debugging ----------
app = FastAPI(title="Opsentrix Agent API")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agentId": AGENT_NAME,
        "connected": sio.connected,
        "backend": BACKEND_URL
    }

@app.post("/cleanup")
async def local_cleanup():
    """Local endpoint for testing - production uses Socket.IO"""
    return run_cleanup()

# ---------- MAIN ----------
if __name__ == "__main__":
    # Pre-warm CPU measurement
    psutil.cpu_percent(interval=1)
    
    print(f"╔══════════════════════════════════════╗")
    print(f"║     OPSENTRIX AGENT STARTING         ║")
    print(f"╠══════════════════════════════════════╣")
    print(f"║ Agent ID: {AGENT_NAME[:20]:<20}      ║")
    print(f"║ Backend:  {BACKEND_URL[:20]:<20}     ║")
    print(f"╚══════════════════════════════════════╝")
    print()
    
    # Start metrics sender in background
    metrics_thread = threading.Thread(target=send_metrics_loop, daemon=True)
    metrics_thread.start()
    
    # Optional: Run FastAPI for local debugging (port 5000)
    # In production, you can disable this completely
    ENABLE_LOCAL_API = os.getenv("ENABLE_LOCAL_API", "false").lower() == "true"
    
    if ENABLE_LOCAL_API:
        print("[*] Local API enabled on port 5000 (for debugging)")
        uvicorn.run(app, host="0.0.0.0", port=5000, log_level="error")
    else:
        print("[*] Agent running (Socket.IO only mode)")
        # Keep the main thread alive
        try:
            while True:
                time.sleep(60)
        except KeyboardInterrupt:
            print("\n[!] Shutting down...")
            sio.disconnect()