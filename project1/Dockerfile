# Stage 1: Builder
FROM python:3.13-slim AS builder

WORKDIR /app

# Install dependencies into a separate directory
COPY requirements.txt .

RUN pip install --no-cache-dir \
    --prefix=/install \
    -r requirements.txt

# Stage 2: Runtime
FROM python:3.13-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]