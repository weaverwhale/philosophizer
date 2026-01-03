#!/usr/bin/env bash
# =============================================================================
# Generate Production Secrets for Philosophizer
# =============================================================================
# This script generates cryptographically secure secrets for production use.
#
# Usage:
#   ./scripts/generate-secrets.sh              # Interactive mode
#   ./scripts/generate-secrets.sh --auto       # Auto-generate and update .env
#   ./scripts/generate-secrets.sh --show-only  # Only show secrets, don't write
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# =============================================================================
# Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Philosophizer Secret Generator${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

# Generate a secure random string
generate_secret() {
    local length=$1
    openssl rand -base64 "$length" | tr -d '\n'
}

# Check if .env exists
check_env_exists() {
    if [[ -f "$ENV_FILE" ]]; then
        return 0
    else
        return 1
    fi
}

# Backup existing .env file
backup_env() {
    if check_env_exists; then
        local backup_file="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        print_success "Backed up existing .env to: $backup_file"
    fi
}

# Generate all secrets
generate_all_secrets() {
    JWT_SECRET=$(generate_secret 64)
    POSTGRES_PASSWORD=$(generate_secret 32)
}

# Display generated secrets
show_secrets() {
    echo ""
    echo -e "${GREEN}Generated Secrets:${NC}"
    echo -e "${BLUE}─────────────────────────────────────────${NC}"
    echo ""
    echo -e "${YELLOW}JWT_SECRET:${NC}"
    echo "$JWT_SECRET"
    echo ""
    echo -e "${YELLOW}POSTGRES_PASSWORD:${NC}"
    echo "$POSTGRES_PASSWORD"
    echo ""
    echo -e "${BLUE}─────────────────────────────────────────${NC}"
}

# Create .env from template
create_env_from_template() {
    if [[ ! -f "$ENV_EXAMPLE" ]]; then
        print_error ".env.example not found!"
        exit 1
    fi
    
    print_info "Creating .env from template..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    
    # Replace placeholder secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
    fi
    
    # Set secure permissions
    chmod 600 "$ENV_FILE"
    
    print_success "Created .env file with generated secrets"
    print_success "File permissions set to 600 (read/write for owner only)"
}

# Update existing .env file
update_existing_env() {
    print_info "Updating existing .env file..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
    fi
    
    # Ensure secure permissions
    chmod 600 "$ENV_FILE"
    
    print_success "Updated .env file with new secrets"
}

# Interactive mode
interactive_mode() {
    print_header
    
    # Generate secrets
    generate_all_secrets
    
    # Show secrets
    show_secrets
    
    # Check if .env exists
    if check_env_exists; then
        echo ""
        print_warning "An .env file already exists!"
        echo ""
        echo "Choose an option:"
        echo "  1) Backup existing .env and update with new secrets"
        echo "  2) Create new .env.new file (keep existing .env)"
        echo "  3) Cancel (don't change anything)"
        echo ""
        read -p "Enter choice [1-3]: " choice
        
        case $choice in
            1)
                backup_env
                update_existing_env
                echo ""
                print_success "Done! Your .env file has been updated with new secrets."
                print_warning "If you have running containers, restart them: docker compose restart"
                ;;
            2)
                ENV_FILE="${ENV_FILE}.new"
                create_env_from_template
                echo ""
                print_success "Done! Created .env.new with generated secrets."
                print_info "Review .env.new and rename to .env when ready."
                ;;
            3)
                echo ""
                print_info "Cancelled. No changes made."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    else
        echo ""
        read -p "Create .env file with these secrets? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_env_from_template
            echo ""
            print_success "Done! Your .env file is ready for production use."
        else
            print_info "Cancelled. No .env file created."
            exit 0
        fi
    fi
    
    echo ""
    print_info "Next steps:"
    echo "  1. Review .env file: nano .env"
    echo "  2. Adjust other settings (OLLAMA_NUM_PARALLEL, models, etc.)"
    echo "  3. Deploy: docker compose up -d"
    echo ""
}

# Auto mode (non-interactive)
auto_mode() {
    print_header
    print_info "Running in automatic mode..."
    
    # Generate secrets
    generate_all_secrets
    
    # Backup and update/create
    if check_env_exists; then
        backup_env
        update_existing_env
    else
        create_env_from_template
    fi
    
    print_success "Secrets generated and saved to .env"
}

# Show only mode
show_only_mode() {
    print_header
    print_info "Generating secrets (show only, no files will be modified)..."
    
    generate_all_secrets
    show_secrets
    
    echo ""
    print_info "To use these secrets, manually add them to your .env file"
}

# =============================================================================
# Main
# =============================================================================

main() {
    # Check if openssl is available
    if ! command -v openssl &> /dev/null; then
        print_error "openssl is required but not installed."
        exit 1
    fi
    
    # Parse arguments
    case "${1:-}" in
        --auto)
            auto_mode
            ;;
        --show-only)
            show_only_mode
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (none)       Interactive mode (default)"
            echo "  --auto       Automatically generate and update .env"
            echo "  --show-only  Display secrets without modifying files"
            echo "  --help       Show this help message"
            echo ""
            exit 0
            ;;
        "")
            interactive_mode
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

main "$@"

