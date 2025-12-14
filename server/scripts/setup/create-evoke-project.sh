#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Store the original working directory
ORIGINAL_DIR="$(pwd)"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
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

# Function to install Git
install_git() {
    echo -e "${YELLOW}Installing Git...${NC}"
    brew install git
}

# Error handling
set -e

# Install required tools if not present
if ! command_exists git; then
    if ! command_exists brew; then
        install_homebrew
        # Re-source shell environment
        if [ -f ~/.zshrc ]; then
            source ~/.zshrc
        elif [ -f ~/.bash_profile ]; then
            source ~/.bash_profile
        fi
    fi
    install_git
    # Re-source shell environment
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc
    elif [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi
fi

# Return to the original directory
cd "$ORIGINAL_DIR"

# Set zip URL
ZIP_URL="https://evokeai.blob.core.windows.net/dist/web-app-template-main.zip"

# Get project name from user
echo -e "${CYAN}Enter the name for your new project:${NC}"
read PROJECT_NAME

# Create temporary directory for zip download and extraction
TEMP_DIR=$(mktemp -d)
TEMP_ZIP="$TEMP_DIR/temp_project.zip"

echo -e "${YELLOW}Downloading project template...${NC}"
curl -L "$ZIP_URL" -o "$TEMP_ZIP"

echo -e "${YELLOW}Extracting files...${NC}"
unzip -q "$TEMP_ZIP" -d "$TEMP_DIR"

# Create the final project directory
PROJECT_PATH="$ORIGINAL_DIR/$PROJECT_NAME"
mkdir -p "$PROJECT_PATH"

# Find the template directory inside the extracted files
TEMPLATE_DIR=$(find "$TEMP_DIR" -type d -name "web-app-template-main" -depth 1)

# Move the contents to the project directory
cp -R "$TEMPLATE_DIR/"* "$PROJECT_PATH/"

# Clean up temporary files
rm -rf "$TEMP_DIR"

# Navigate to project directory
cd "$PROJECT_PATH"

# Initialize git repository
echo -e "${YELLOW}Initializing Git repository...${NC}"
git init

echo -e "\n${GREEN}Project template downloaded successfully!${NC}"
echo -e "${YELLOW}Running setup script...${NC}"

# Make setup script executable and run it if it exists
if [ -f "setup-project.sh" ]; then
    chmod +x setup-project.sh
    ./setup-project.sh
else
    echo -e "${RED}Setup script not found. Please run setup manually.${NC}"
fi