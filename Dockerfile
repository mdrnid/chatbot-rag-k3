FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# 1. Pasang dependensi sistem
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Pasang library Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Salin kode aplikasi dan basis data vektor
COPY src/ ./src/
COPY data/documents.json ./data/documents.json
COPY data/chroma/ ./data/chroma/

# 4. Buat folder penyimpanan log
RUN mkdir -p logs

# 5. Jalankan uvicorn pada port yang diberikan Cloud Run (bawaan 8080)
EXPOSE 8080
CMD ["sh", "-c", "uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8080}"]