# TripWise Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy backend requirements and install
ENV REFRESHED_AT=2026-02-03
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Expose port
EXPOSE 8000

# Start the server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
