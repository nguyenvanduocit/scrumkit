#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Configuration
CF_PROJECT_NAME="${CF_PROJECT_NAME:-scrumkit}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-a44473eab2f968599bc24d5d1a4853f1}"
PORT="${PORT:-7001}"

usage() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  server    Deploy backend server (Docker)"
    echo "  webapp    Deploy frontend (Cloudflare Pages)"
    echo "  all       Deploy both server and webapp"
    echo ""
    exit 1
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found"
        exit 1
    fi
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running"
        exit 1
    fi
    print_status "Docker available"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler not found. Install with: bun add -g wrangler"
        exit 1
    fi
    print_status "Wrangler available"
}

deploy_server() {
    print_status "Deploying backend server..."
    check_docker

    cd "$(dirname "$0")/.."

    # Build and start
    docker compose up -d --build server

    print_status "Server deployed"
    docker compose ps
    echo ""
    docker compose logs --tail=20 server
}

deploy_webapp() {
    print_status "Deploying webapp..."
    check_wrangler

    cd "$(dirname "$0")/../packages/frontend"

    # Build
    print_status "Building frontend..."
    NODE_ENV=production bun run build

    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi

    # Deploy
    print_status "Deploying to Cloudflare Pages..."
    CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID" wrangler pages deploy dist --project-name="$CF_PROJECT_NAME"

    print_status "Webapp deployed to https://${CF_PROJECT_NAME}.pages.dev"
}

deploy_all() {
    deploy_server &
    SERVER_PID=$!

    deploy_webapp &
    WEBAPP_PID=$!

    wait $SERVER_PID
    SERVER_STATUS=$?

    wait $WEBAPP_PID
    WEBAPP_STATUS=$?

    if [ $SERVER_STATUS -ne 0 ] || [ $WEBAPP_STATUS -ne 0 ]; then
        print_error "Deployment failed"
        exit 1
    fi

    print_status "All deployments completed"
}

case "${1:-}" in
    server) deploy_server ;;
    webapp) deploy_webapp ;;
    all) deploy_all ;;
    *) usage ;;
esac
