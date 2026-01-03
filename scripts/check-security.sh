#!/usr/bin/env bash
# =============================================================================
# Pre-Deployment Security Check for Philosophizer
# =============================================================================
# Run this script before deploying to production to verify security settings
#
# Usage: ./scripts/check-security.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
PASSED=0

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Philosophizer Security Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

print_warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

# Check if .env file exists
check_env_exists() {
    echo ""
    print_info "Checking for .env file..."
    if [[ -f .env ]]; then
        print_pass ".env file exists"
        return 0
    else
        print_fail ".env file not found"
        print_info "Run: ./scripts/generate-secrets.sh"
        return 1
    fi
}

# Check .env file permissions
check_env_permissions() {
    print_info "Checking .env file permissions..."
    if [[ ! -f .env ]]; then
        return 1
    fi
    
    local perms=$(stat -f "%Lp" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    
    if [[ "$perms" == "600" ]]; then
        print_pass ".env permissions are secure (600)"
    else
        print_warn ".env permissions are $perms (should be 600)"
        print_info "Fix with: chmod 600 .env"
    fi
}

# Check for default JWT_SECRET
check_jwt_secret() {
    print_info "Checking JWT_SECRET..."
    if [[ ! -f .env ]]; then
        return 1
    fi
    
    local jwt_secret=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ -z "$jwt_secret" ]]; then
        print_fail "JWT_SECRET is not set"
        print_info "Run: ./scripts/generate-secrets.sh"
    elif [[ "$jwt_secret" == *"change"* ]] || [[ "$jwt_secret" == *"CHANGE"* ]]; then
        print_fail "JWT_SECRET contains default value"
        print_info "Run: ./scripts/generate-secrets.sh"
    elif [[ ${#jwt_secret} -lt 32 ]]; then
        print_warn "JWT_SECRET is too short (${#jwt_secret} chars, recommend 64+)"
    else
        print_pass "JWT_SECRET is set and looks secure (${#jwt_secret} chars)"
    fi
}

# Check for default POSTGRES_PASSWORD
check_postgres_password() {
    print_info "Checking POSTGRES_PASSWORD..."
    if [[ ! -f .env ]]; then
        return 1
    fi
    
    local pg_pass=$(grep "^POSTGRES_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ -z "$pg_pass" ]]; then
        print_fail "POSTGRES_PASSWORD is not set"
        print_info "Run: ./scripts/generate-secrets.sh"
    elif [[ "$pg_pass" == "postgres" ]]; then
        print_fail "POSTGRES_PASSWORD is using default value 'postgres'"
        print_info "Run: ./scripts/generate-secrets.sh"
    elif [[ "$pg_pass" == *"change"* ]] || [[ "$pg_pass" == *"CHANGE"* ]]; then
        print_fail "POSTGRES_PASSWORD contains default value"
        print_info "Run: ./scripts/generate-secrets.sh"
    elif [[ ${#pg_pass} -lt 16 ]]; then
        print_warn "POSTGRES_PASSWORD is short (${#pg_pass} chars, recommend 32+)"
    else
        print_pass "POSTGRES_PASSWORD is set and looks secure (${#pg_pass} chars)"
    fi
}

# Check .env is in .gitignore
check_gitignore() {
    print_info "Checking .gitignore..."
    if [[ -f .gitignore ]]; then
        if grep -q "^\.env$" .gitignore; then
            print_pass ".env is in .gitignore"
        else
            print_fail ".env is NOT in .gitignore"
            print_info "Add '.env' to .gitignore immediately!"
        fi
    else
        print_warn ".gitignore file not found"
    fi
}

# Check if .env is tracked by git
check_git_tracked() {
    print_info "Checking if .env is tracked by git..."
    if [[ ! -d .git ]]; then
        print_info "Not a git repository (skipping)"
        return
    fi
    
    if git ls-files --error-unmatch .env >/dev/null 2>&1; then
        print_fail ".env is tracked by git!"
        print_info "Remove with: git rm --cached .env"
    else
        print_pass ".env is not tracked by git"
    fi
}

# Check NODE_ENV
check_node_env() {
    print_info "Checking NODE_ENV..."
    if [[ ! -f .env ]]; then
        return 1
    fi
    
    local node_env=$(grep "^NODE_ENV=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ "$node_env" == "production" ]]; then
        print_pass "NODE_ENV is set to production"
    else
        print_warn "NODE_ENV is not set to 'production' (current: ${node_env:-not set})"
    fi
}

# Check for OLLAMA configuration
check_ollama_config() {
    print_info "Checking Ollama configuration..."
    if [[ ! -f .env ]]; then
        return 1
    fi
    
    local num_parallel=$(grep "^OLLAMA_NUM_PARALLEL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    local num_gpu=$(grep "^OLLAMA_NUM_GPU=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ -n "$num_parallel" ]]; then
        print_pass "OLLAMA_NUM_PARALLEL is configured: $num_parallel"
    else
        print_info "OLLAMA_NUM_PARALLEL not set (will use default: 8)"
    fi
    
    if [[ -n "$num_gpu" ]]; then
        print_pass "OLLAMA_NUM_GPU is configured: $num_gpu"
    else
        print_info "OLLAMA_NUM_GPU not set (will use default: 1)"
    fi
}

# Check docker-compose file
check_docker_compose() {
    print_info "Checking docker-compose configuration..."
    
    if [[ -f docker-compose.dgx.yml ]]; then
        print_pass "docker-compose.dgx.yml found for DGX deployment"
        
        # Check if it requires secrets
        if grep -q "JWT_SECRET:?" docker-compose.dgx.yml; then
            print_pass "docker-compose.dgx.yml enforces required secrets"
        fi
    else
        print_warn "docker-compose.dgx.yml not found"
    fi
}

# Check NVIDIA GPU availability (if on DGX)
check_nvidia_gpu() {
    print_info "Checking NVIDIA GPU availability..."
    
    if command -v nvidia-smi &> /dev/null; then
        if nvidia-smi >/dev/null 2>&1; then
            local gpu_count=$(nvidia-smi --list-gpus | wc -l)
            print_pass "NVIDIA GPU detected ($gpu_count GPU(s) available)"
        else
            print_warn "nvidia-smi found but cannot access GPU"
        fi
    else
        print_info "nvidia-smi not found (not running on GPU server?)"
    fi
}

# Check Docker GPU support
check_docker_gpu() {
    print_info "Checking Docker GPU support..."
    
    if command -v docker &> /dev/null; then
        if docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi >/dev/null 2>&1; then
            print_pass "Docker can access NVIDIA GPU"
        else
            print_warn "Docker cannot access GPU (NVIDIA Container Toolkit needed?)"
            print_info "Install: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        fi
    else
        print_info "Docker not found (skipping GPU check)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${GREEN}Passed:   $PASSED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "${RED}Errors:   $ERRORS${NC}"
    echo ""
    
    if [[ $ERRORS -eq 0 ]]; then
        echo -e "${GREEN}✓ Security check passed!${NC}"
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}⚠ There are warnings to review.${NC}"
        fi
        echo ""
        echo "Ready for deployment:"
        echo "  docker compose -f docker-compose.dgx.yml up -d"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Security check failed!${NC}"
        echo ""
        echo "Fix the errors above before deploying."
        echo "Quick fix: ./scripts/generate-secrets.sh"
        echo ""
        return 1
    fi
}

# Main
main() {
    print_header
    
    # Run all checks
    check_env_exists
    check_env_permissions
    check_jwt_secret
    check_postgres_password
    check_gitignore
    check_git_tracked
    check_node_env
    check_ollama_config
    check_docker_compose
    check_nvidia_gpu
    check_docker_gpu
    
    # Print summary and exit
    print_summary
}

main

