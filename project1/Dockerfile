# base image
FROM python:latest

WORKDIR /app

ARG PORTNUMBER=8000

ENV HOST="localhost"
ENV PORT=${PORTNUMBER}
ENV PROTOCOL="http"

WORKDIR /app

# requirement file environment setup
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /docs && curl -fsSL \
    https://raw.githubusercontent.com/dev-fm-thekk/Learn-docker/main/docs/install/linux.md \
    -o /docs/linux.md

# src copy
COPY . .

# network settings
EXPOSE 8000

CMD ["python", "app.py"]