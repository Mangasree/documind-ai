FROM python:3.10

WORKDIR /code

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY app /code/app

# Expose frontend
RUN mkdir -p /code/app/uploads

# Env vars
ENV PYTHONUNBUFFERED=1

# Entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
