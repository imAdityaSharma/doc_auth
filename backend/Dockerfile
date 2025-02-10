# Use an official Python image
FROM python:3.13

# Set the working directory
WORKDIR /app

# Copy requirements.txt first to leverage Docker caching
COPY requirements.txt /app/

# Install dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application files
COPY . /app/

# Expose the Flask port
EXPOSE 5000

# Start the Flask application
CMD ["python", "app.py"]
