#!/bin/bash

# ERP POS Deployment Script
# Usage: ./deploy.sh [backend|frontend|both|migrations]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ERP POS Deployment Script${NC}"
echo "================================"
echo ""

# Navigate to project directory
cd /home/erp-pos-system

# Function to build backend
build_backend() {
    echo -e "${YELLOW}📦 Building backend Docker image...${NC}"
    docker build -t erp-pos-system-backend:latest ./server
    echo -e "${GREEN}✅ Backend image built${NC}"
}

# Function to build frontend
build_frontend() {
    echo -e "${YELLOW}📦 Building frontend assets...${NC}"
    cd client
    npm run build
    cd ..

    echo -e "${YELLOW}📦 Building frontend Docker image...${NC}"
    docker build -t erp-pos-system-frontend:latest ./client
    echo -e "${GREEN}✅ Frontend image built${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}🔄 Updating backend service...${NC}"
    docker service update --image erp-pos-system-backend:latest --force gretta-erp_backend
    echo -e "${GREEN}✅ Backend service updated${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}🔄 Updating frontend service...${NC}"
    docker service update --image erp-pos-system-frontend:latest --force gretta-erp_frontend
    echo -e "${GREEN}✅ Frontend service updated${NC}"
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    BACKEND_CONTAINER=$(docker ps | grep "gretta-erp_backend" | awk '{print $1}')

    if [ -z "$BACKEND_CONTAINER" ]; then
        echo -e "${RED}❌ Backend container not found${NC}"
        exit 1
    fi

    docker exec $BACKEND_CONTAINER npx sequelize-cli db:migrate
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Function to check service status
check_status() {
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker service ps gretta-erp_backend gretta-erp_frontend | grep Running || echo "No services running"

    echo ""
    echo -e "${BLUE}🔍 Testing endpoints:${NC}"

    # Test backend
    if curl -s -f https://api.grettas-erp.com/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API: OK${NC}"
    else
        echo -e "${RED}❌ Backend API: Failed${NC}"
    fi

    # Test frontend
    if curl -s -f https://grettas-erp.com > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${RED}❌ Frontend: Failed${NC}"
    fi
}

# Main deployment logic
if [ $# -eq 0 ]; then
    # Interactive mode
    echo "What do you want to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both"
    echo "4) Run migrations only"
    echo "5) Full deployment (migrations + backend + frontend)"
    read -p "Enter choice (1-5): " choice

    case $choice in
        1)
            build_backend
            deploy_backend
            ;;
        2)
            build_frontend
            deploy_frontend
            ;;
        3)
            build_backend
            build_frontend
            deploy_backend
            deploy_frontend
            ;;
        4)
            run_migrations
            ;;
        5)
            run_migrations
            build_backend
            build_frontend
            deploy_backend
            deploy_frontend
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
else
    # Command line argument mode
    case $1 in
        backend)
            build_backend
            deploy_backend
            ;;
        frontend)
            build_frontend
            deploy_frontend
            ;;
        both)
            build_backend
            build_frontend
            deploy_backend
            deploy_frontend
            ;;
        migrations)
            run_migrations
            ;;
        full)
            run_migrations
            build_backend
            build_frontend
            deploy_backend
            deploy_frontend
            ;;
        *)
            echo -e "${RED}❌ Invalid argument${NC}"
            echo "Usage: $0 [backend|frontend|both|migrations|full]"
            exit 1
            ;;
    esac
fi

# Check final status
check_status

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)"
echo "  - Test the system at https://grettas-erp.com"
echo "  - Check logs: docker service logs --tail 100 gretta-erp_backend"
