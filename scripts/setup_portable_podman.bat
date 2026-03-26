@echo off
REM Portable Podman Setup - Docker Alternative
REM Podman is daemonless and more portable

echo Setting up Portable Podman...

REM Create portable directory
if not exist "D:\PortablePodman" mkdir "D:\PortablePodman"
cd /d "D:\PortablePodman"

REM Download Podman (if not present)
if not exist "podman.zip" (
    echo Downloading Podman...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/containers/podman/releases/download/v4.9.4/podman-windows-4.9.4.zip' -OutFile 'podman.zip'"
)

REM Extract Podman
if not exist "podman" (
    echo Extracting Podman...
    powershell -Command "Expand-Archive -Path 'podman.zip' -DestinationPath '.'"
)

REM Add to PATH
set PATH=%CD%\podman\bin;%PATH%

REM Initialize Podman
echo Initializing Podman...
podman machine init default --rootfs-volume %CD%\podman-data

REM Start Podman
echo Starting Podman...
podman machine start default

echo Portable Podman is ready!
echo Use 'podman --version' to verify
echo Use 'podman run hello-world' to test
echo Podman is compatible with Docker commands
