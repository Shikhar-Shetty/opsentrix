import os
import time
import socket
import psutil 
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:4000/telemetry")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "dummy-token")
AGENT_NAME = os.getenv("AGENT_NAME", socket.gethostname())

def get_metrics():
    return {    
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "cpu": psutil.cpu_percent(interval=0),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage("/").percent,
        "processes": len(psutil.pids()),
        "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

def main():
    while True:
        try:
            payload = get_metrics()
            print(payload)
            res = requests.post(BACKEND_URL, json=payload, timeout=5)
            print(f"[+] Sent heartbeat: {res.status_code}")
        except Exception as e:
            print(f"[!] Error sending heartbeat: {e}")
        time.sleep(10) 

if __name__ == "__main__":
    main()