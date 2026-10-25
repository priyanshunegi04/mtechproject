# ============================================================================
# ThaparElectiveAI ML Microservice — Multi-Stage Production Dockerfile (Python 3.11)
# ============================================================================
FROM python:3.11-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install -r requirements.txt

# ----------------------------------------------------------------------------
# Production Runtime Stage
# ----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=10000

RUN groupadd -g 1001 tietml && useradd -r -u 1001 -g tietml tietml

COPY --from=builder --chown=tietml:tietml /opt/venv /opt/venv
COPY --chown=tietml:tietml app ./app
COPY --chown=tietml:tietml data ./data
COPY --chown=tietml:tietml models ./models

USER tietml

EXPOSE 10000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 2"]
