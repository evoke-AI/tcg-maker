#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Store the original working directory and project root
ORIGINAL_DIR="$(pwd)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if git repository is initialized and on main branch
git_initialized() {
    # Check if .git directory exists
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        return 1
    fi

    # Check if we're on main branch
    cd "$PROJECT_ROOT"
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    cd "$ORIGINAL_DIR"
    if [ "$current_branch" = "main" ]; then
        return 0
    else
        return 1
    fi
}

# Function to install Homebrew
install_homebrew() {
    echo -e "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
}

# Function to install Node.js
install_node() {
    echo -e "${YELLOW}Installing Node.js 20 LTS...${NC}"
    brew install node@20
    brew link node@20
}

# Function to install pnpm
install_pnpm() {
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm
}

# Error handling
set -e

echo -e "${YELLOW}Starting project setup...${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Check if git repository needs initialization
if ! git_initialized; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
    git checkout -b main
else
    echo -e "${GREEN}Git repository already initialized and on main branch.${NC}"
fi

# Install required tools if not present
if ! command_exists brew; then
    install_homebrew
    # Re-source shell environment
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc
    elif [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi
fi

if ! command_exists node; then
    install_node
    # Re-source shell environment
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc
    elif [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi
fi

if ! command_exists pnpm; then
    install_pnpm
    # Re-source shell environment
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc
    elif [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi
fi

# Install dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
cd "$PROJECT_ROOT" && pnpm install --prod=false

echo -e "${YELLOW}Setting up development database...${NC}"
# Copy environment files if they don't exist
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env.local"
fi
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
fi

# Set up development schema and migrations
cp "$PROJECT_ROOT/prisma/schema.dev.prisma" "$PROJECT_ROOT/prisma/schema.prisma"
if [ -d "$PROJECT_ROOT/prisma/migrations-dev" ]; then
    mkdir -p "$PROJECT_ROOT/prisma/migrations"
    cp -R "$PROJECT_ROOT/prisma/migrations-dev/"* "$PROJECT_ROOT/prisma/migrations/"
fi

# Run migrations and setup
cd "$PROJECT_ROOT"
pnpm prisma migrate dev
pnpm prisma db seed
pnpm prisma generate

# Display completion message
echo -e "\n${GREEN}Setup completed successfully!${NC}"

# Display login credentials
echo -e "${YELLOW}<!> DEFAULT LOGIN CREDENTIALS <!>${NC}"
echo -e "${YELLOW}-------------------------------${NC}"
echo -e "${CYAN}Email: ${NC}admin@evoke-ai.co"
echo -e "${CYAN}Password: ${NC}qwerty"
echo -e "${YELLOW}-------------------------------${NC}"
echo -e "${YELLOW}<!> Please change these credentials in production <!>${NC}"

# Display debugging instructions
echo -e "\n${CYAN}To debug in VS Code:${NC}"
echo -e "1. Open the project in VS Code: code ."
echo -e "2. Press F5 or click the 'Run and Debug' icon in the sidebar"
echo -e "3. Select 'Run Web server' from the debug configuration dropdown"
echo -e "4. Click the green play button or press F5 to start debugging"

# Return to original directory
cd "$ORIGINAL_DIR" 