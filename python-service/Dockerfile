FROM python:3.10-slim
RUN apt-get update && apt-get install -y curl && apt-get clean

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY /app .
EXPOSE 8082
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082", "--workers", "2", "--proxy-headers"]
