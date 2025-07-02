# Use Python base image
FROM python:3.10

# Set work directory
WORKDIR /code

# Copy dependencies
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app files
COPY . .

# Expose default FastAPI port
EXPOSE 7860

# Run the app with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
