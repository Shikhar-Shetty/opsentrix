FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY cleanup.sh ./
COPY agent.py ./

RUN chmod +x cleanup.sh

CMD ["python3", "agent.py"]