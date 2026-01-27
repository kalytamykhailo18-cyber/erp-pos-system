#!/bin/bash

# ERP POS Deployment Script
# Usage: ./deploy.sh [backend|frontend|both|migrations|nginx|status]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ERP POS Deployment Script${NC}"
echo "================================"
echo ""

# Navigate to project directory
cd /home/erp-pos-system

# Function to check if nginx-ssl-proxy is running
check_nginx_proxy() {
    if docker ps | grep -q "nginx-ssl-proxy"; then
        echo -e "${GREEN}✅ nginx-ssl-proxy is running${NC}"
        return 0
    else
        echo -e "${RED}❌ nginx-ssl-proxy is NOT running${NC}"
        return 1
    fi
}

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

    echo -e "${YELLOW}⏳ Waiting for service to stabilize...${NC}"
    sleep 5
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}🔄 Updating frontend service...${NC}"
    docker service update --image erp-pos-system-frontend:latest --force gretta-erp_frontend
    echo -e "${GREEN}✅ Frontend service updated${NC}"

    echo -e "${YELLOW}⏳ Waiting for service to stabilize...${NC}"
    sleep 5
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    BACKEND_CONTAINER=$(docker ps | grep "gretta-erp_backend" | awk '{print $1}')

    if [ -z "$BACKEND_CONTAINER" ]; then
        echo -e "${RED}❌ Backend container not found${NC}"
        echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
        sleep 10
        BACKEND_CONTAINER=$(docker ps | grep "gretta-erp_backend" | awk '{print $1}')
        if [ -z "$BACKEND_CONTAINER" ]; then
            echo -e "${RED}❌ Backend still not running${NC}"
            exit 1
        fi
    fi

    docker exec $BACKEND_CONTAINER npx sequelize-cli db:migrate
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Function to reload nginx configuration
reload_nginx() {
    echo -e "${YELLOW}🔄 Testing nginx configuration...${NC}"
    if docker exec nginx-ssl-proxy nginx -t; then
        echo -e "${YELLOW}🔄 Reloading nginx...${NC}"
        docker exec nginx-ssl-proxy nginx -s reload
        echo -e "${GREEN}✅ Nginx configuration reloaded${NC}"
    else
        echo -e "${RED}❌ Nginx configuration test failed${NC}"
        exit 1
    fi
}

# Function to check SSL certificate expiry
check_ssl_certs() {
    echo -e "${CYAN}🔒 Checking SSL certificates...${NC}"
    if [ -f "/home/erp-pos-system/nginx-ssl/certbot/conf/live/grettas-erp.com/fullchain.pem" ]; then
        CERT_FILE="/home/erp-pos-system/nginx-ssl/certbot/conf/live/grettas-erp.com/fullchain.pem"
        echo -e "${CYAN}   Certificate: $CERT_FILE${NC}"
        echo -e "${GREEN}✅ SSL certificates present${NC}"
    else
        echo -e "${YELLOW}⚠️  SSL certificates not found at expected location${NC}"
    fi
}

# Function to check service status
check_status() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Docker Swarm Services${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    docker service ls | grep -E "NAME|gretta-erp"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 Running Containers${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    docker ps --filter "name=gretta-erp" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔧 Infrastructure Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Check nginx-ssl-proxy
    check_nginx_proxy

    # Check SSL certificates
    check_ssl_certs

    # Check PostgreSQL
    if docker ps | grep -q "postgres-erp"; then
        echo -e "${GREEN}✅ PostgreSQL database is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL database is NOT running${NC}"
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔍 Endpoint Health Checks${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Test backend health endpoint (correct path is /health not /api/v1/health)
    echo -n "Backend API (https://api.grettas-erp.com/health): "
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.grettas-erp.com/health 2>/dev/null || echo "000")
    if [ "$BACKEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $BACKEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $BACKEND_STATUS)${NC}"
    fi

    # Test frontend
    echo -n "Frontend (https://grettas-erp.com): "
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://grettas-erp.com 2>/dev/null || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $FRONTEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $FRONTEND_STATUS)${NC}"
    fi

    # Test direct backend port
    echo -n "Backend Direct (http://138.219.41.188:5000/health): "
    BACKEND_DIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://138.219.41.188:5000/health 2>/dev/null || echo "000")
    if [ "$BACKEND_DIRECT" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $BACKEND_DIRECT)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP $BACKEND_DIRECT${NC}"
    fi

    # DNS Check
    echo ""
    echo -e "${CYAN}🌐 DNS Resolution:${NC}"
    echo -n "   grettas-erp.com → "
    dig +short grettas-erp.com | head -1
    echo -n "   api.grettas-erp.com → "
    dig +short api.grettas-erp.com | head -1
}

# Main deployment logic
if [ $# -eq 0 ]; then
    # Interactive mode
    echo "What do you want to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both (Backend + Frontend)"
    echo "4) Run migrations only"
    echo "5) Full deployment (Migrations + Backend + Frontend)"
    echo "6) Reload nginx configuration"
    echo "7) Check status only"
    read -p "Enter choice (1-7): " choice

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
        6)
            reload_nginx
            check_status
            exit 0
            ;;
        7)
            check_status
            exit 0
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
            check_status
            exit 0
            ;;
        full)
            run_migrations
            build_backend
            build_frontend
            deploy_backend
            deploy_frontend
            ;;
        nginx)
            reload_nginx
            check_status
            exit 0
            ;;
        status)
            check_status
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid argument${NC}"
            echo ""
            echo "Usage: $0 [backend|frontend|both|migrations|full|nginx|status]"
            echo ""
            echo "Options:"
            echo "  backend     - Build and deploy backend only"
            echo "  frontend    - Build and deploy frontend only"
            echo "  both        - Build and deploy both backend and frontend"
            echo "  migrations  - Run database migrations only"
            echo "  full        - Run migrations, then build and deploy everything"
            echo "  nginx       - Reload nginx configuration"
            echo "  status      - Check system status without deploying"
            echo ""
            exit 1
            ;;
    esac
fi

# Check final status
check_status

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📱 Application URLs:${NC}"
echo "   Frontend:     https://grettas-erp.com"
echo "   Backend API:  https://api.grettas-erp.com"
echo "   Health Check: https://api.grettas-erp.com/health"
echo ""
echo -e "${CYAN}📋 Useful Commands:${NC}"
echo "   Backend logs:  docker service logs --tail 100 -f gretta-erp_backend"
echo "   Frontend logs: docker service logs --tail 100 -f gretta-erp_frontend"
echo "   Nginx logs:    docker logs nginx-ssl-proxy"
echo "   Check status:  ./deploy.sh status"
echo "   Reload nginx:  ./deploy.sh nginx"
echo "   Run migrations: ./deploy.sh migrations"
echo ""
echo -e "${YELLOW}⚠️  Remember:${NC}"
echo "   • Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   • Test in incognito mode to bypass service worker cache"
echo "   • Check CACHE_CLEAR_INSTRUCTIONS.md if needed"
echo ""
