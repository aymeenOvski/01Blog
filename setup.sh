#!/usr/bin/env bash

# Stop execution immediately if any command fails
set -e

echo "=========================================="
echo "   Starting System Tools Installation     "
echo "=========================================="

# 1. Install Micromamba
echo "--> Installing Micromamba..."
curl -L micro.mamba.pm/install.sh | bash

# Ensure binary is on PATH immediately
export PATH="$HOME/.local/bin:$PATH"
export MAMBA_EXE="$HOME/.local/bin/micromamba"
export MAMBA_ROOT_PREFIX="$HOME/micromamba"

# Append init to .zshrc if present
if [ -f "$HOME/.zshrc" ] && ! grep -q "MAMBA_EXE" "$HOME/.zshrc"; then
    "$MAMBA_EXE" shell init --shell zsh --root-prefix "$MAMBA_ROOT_PREFIX"
fi

# Append init to .bashrc if present
if [ -f "$HOME/.bashrc" ] && ! grep -q "MAMBA_EXE" "$HOME/.bashrc"; then
    "$MAMBA_EXE" shell init --shell bash --root-prefix "$MAMBA_ROOT_PREFIX"
fi

# Hook micromamba directly into this bash script session
eval "$("$MAMBA_EXE" shell hook --shell bash)"

# 2. Create & Activate the '01blog' environment with tools
ENV_NAME="01blog"
echo "--> Creating and setting up Micromamba environment '$ENV_NAME'..."

if micromamba env list | grep -q "$ENV_NAME"; then
    echo "Environment '$ENV_NAME' already exists. Installing/updating packages..."
    micromamba install -n "$ENV_NAME" postgresql nodejs maven -c conda-forge -y
else
    micromamba create -n "$ENV_NAME" postgresql nodejs maven -c conda-forge -y
fi

# Activate the environment within this script session
micromamba activate "$ENV_NAME"

# 3. Install Angular CLI inside the active 01blog environment
echo "--> Installing Angular CLI globally inside '$ENV_NAME' environment..."
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
echo " Setup Complete! "
echo " Run: micromamba activate 01blog"
echo "=========================================="