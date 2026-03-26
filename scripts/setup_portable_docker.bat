@echo off
REM Portable Docker Setup for Windows
REM This creates a Docker environment without installing Docker Desktop

echo Setting up Portable Docker...

REM Create portable Docker directory
if not exist "D:\PortableDocker" mkdir "D:\PortableDocker"
cd /d "D:\PortableDocker"

REM Download Docker binaries (if not present)
if not exist "docker.zip" (
    echo Downloading Docker binaries...
    powershell -Command "Invoke-WebRequest -Uri 'https://download.docker.com/win/static/stable/x86_64/docker-24.0.6.zip' -OutFile 'docker.zip'
)

REM Extract Docker binaries
if not exist "docker" (
    echo Extracting Docker binaries...
    powershell -Command "Expand-Archive -Path 'docker.zip' -DestinationPath '.'"
)

REM Add Docker to PATH for this session
set PATH=%CD%\docker;%PATH%

REM Create Docker config
if not exist "docker-data" mkdir "docker-data"

REM Start Docker daemon
echo Starting Docker daemon...
dockerd --data-root=%CD%\docker-data --host=unix:///var/run/docker.sock --pidfile=docker.pid --detach

echo Portable Docker is ready!
echo Use 'docker --version' to verify
echo Use 'docker run hello-world' to test
