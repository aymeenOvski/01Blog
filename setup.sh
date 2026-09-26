#!/usr/bin/env bash

# Stop execution immediately if any command fails
set -e

echo "=========================================="
echo "   Starting System Tools Installation     "
echo "=========================================="

# 1. Install Micromamba
echo "--> Installing Micromamba..."
curl -L micro.mamba.pm/install.sh | bash

# Source shell configuration to make micromamba available in current session
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc"
fi

# Ensure micromamba binary is accessible
export PATH="$HOME/.local/bin:$PATH"

# 2. Install PostgreSQL, Node.js, and Maven via Micromamba
echo "--> Installing PostgreSQL, Node.js, and Maven via conda-forge..."
micromamba install postgresql nodejs maven -c conda-forge -y

# 3. Install Angular CLI Globally
echo "--> Installing Angular CLI globally via npm..."
npm install -g @angular/cli

echo "=========================================="
echo "      Checking Installed Versions         "
echo "=========================================="
micromamba --version
postgres --version
node -v
mvn -version
ng version

echo "=========================================="
echo " Setup Complete! Restart your terminal or "
echo " run: source ~/.bashrc (or source ~/.zshrc)"
echo "=========================================="