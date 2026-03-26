#!/bin/bash
# Portable Docker Setup using WSL 2
# This creates a Docker environment in WSL without Docker Desktop

echo "Setting up Portable Docker in WSL..."

# Create portable Docker directory
PORTABLE_DOCKER_DIR="/mnt/d/PortableDocker"
mkdir -p "$PORTABLE_DOCKER_DIR"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Create Docker data directory
sudo mkdir -p "$PORTABLE_DOCKER_DIR/docker-data"
sudo chown $USER:$USER "$PORTABLE_DOCKER_DIR/docker-data"

# Configure Docker to use portable data directory
if [ ! -f ~/.docker/daemon.json ]; then
    mkdir -p ~/.docker
    cat > ~/.docker/daemon.json << EOF
{
    "data-root": "$PORTABLE_DOCKER_DIR/docker-data",
    "storage-driver": "overlay2"
}
EOF
fi

# Start Docker daemon
sudo service docker start

echo "Portable Docker is ready!"
echo "Docker version:"
docker --version
echo ""
echo "Test with:"
docker run hello-world
