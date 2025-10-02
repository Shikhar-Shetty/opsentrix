import os
import time
import psutil
import socketio

sio = socketio.Client()

AGENT_NAME = os.getenv("AGENT_NAME", "agt_00e2fc086826")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "tok_bd62c7991d7b58c7d8a66871")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000") 

@sio.event
def connect():
    print("[+] Connected to backend")

@sio.event
def disconnect():
    print("[-] Disconnected from backend")

psutil.cpu_percent(interval=None)

def get_metrics():
    return {    
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "cpu": psutil.cpu_percent(interval=None), 
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "processes": len(psutil.pids()),
        "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

def main():
    sio.connect(BACKEND_URL)

    while True:
        metrics = get_metrics()
        print("[>] Sending metrics:", metrics)
        sio.emit("agent_metrics", metrics)
        time.sleep(10)  

if __name__ == "__main__":
    main()
