import os
import time
import socket
import psutil
import socketio

# Socket.IO client
sio = socketio.Client()

AGENT_TOKEN = os.getenv("AGENT_TOKEN", "agt_00e2fc086826")
AGENT_NAME = os.getenv("AGENT_NAME", "tok_bd62c7991d7b58c7d8a66871")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000") 

# Event handlers
@sio.event
def connect():
    print("[+] Connected to backend")

@sio.event
def disconnect():
    print("[-] Disconnected from backend")

def get_metrics():
    return {    
        "id": AGENT_NAME,
        "token": AGENT_TOKEN,
        "status": "online",
        "cpu": psutil.cpu_percent(interval=0),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "processes": len(psutil.pids()),
        "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

def main():
    # Connect to backend
    sio.connect(BACKEND_URL)

    while True:
        metrics = get_metrics()
        print("[>] Sending metrics:", metrics)
        sio.emit("agent_metrics", metrics)
        time.sleep(10)  # send every 10 seconds
        # try:
        #     payload = get_metrics()
        #     print(payload)
        #     res = requests.post(BACKEND_URL, json=payload, timeout=5)
        #     print(f"[+] Sent heartbeat: {res.status_code}")
        # except Exception as e:
        #     print(f"[!] Error sending heartbeat: {e}")
        # time.sleep(10) 

if __name__ == "__main__":
    main()
