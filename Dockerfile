# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.11.10-slim-bookworm

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

#Install GCC to enable build of a specific pip requirement
RUN apt-get update && apt-get install -y gcc curl gpg

# Install Google Cloud CLI
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates gnupg curl \
  && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
  && apt-get update && apt-get install -y google-cloud-cli

# Install pip requirements
COPY requirements.txt .
RUN python -m pip install --no-deps -r requirements.txt

WORKDIR /app
COPY . /app

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
#RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
#USER appuser

CMD ["python", "app.py"]
