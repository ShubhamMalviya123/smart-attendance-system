FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip

RUN pip install --no-cache-dir dlib-bin==19.24.6

RUN pip install --no-cache-dir --no-deps face-recognition==1.3.0

RUN pip install --no-cache-dir \
    face-recognition-models==0.3.0 \
    numpy==1.26.4 \
    opencv-python==4.9.0.80 \
    pillow==10.4.0

RUN pip install --no-cache-dir \
    fastapi==0.110.0 \
    "uvicorn[standard]==0.29.0" \
    python-multipart==0.0.9 \
    pydantic==2.6.4

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
