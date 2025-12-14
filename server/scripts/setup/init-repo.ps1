# Store the original working directory and project root
$originalLocation = Get-Location
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Function to check if running as administrator
function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try { if (Get-Command $command) { return $true } }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Function to check if git repository is initialized and on main branch
function Test-GitInitialized {
    try {
        # Check if .git directory exists
        if (-not (Test-Path (Join-Path $projectRoot ".git"))) {
            return $false
        }

        # Check if we're on main branch
        Set-Location $projectRoot
        $currentBranch = git rev-parse --abbrev-ref HEAD
        return $currentBranch -eq "main"
    } catch {
        return $false
    } finally {
        Set-Location $originalLocation
    }
}

# Function to install Chocolatey
function Install-Chocolatey {
    Write-Host "Installing Chocolatey for environment refresh support..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment after chocolatey install
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    refreshenv
}

# Function to install Node.js
function Install-NodeJS {
    Write-Host "Installing Node.js 20 LTS..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --version 20.11.1
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    $env:PSModulePath = [System.Environment]::GetEnvironmentVariable("PSModulePath","Machine")
    refreshenv
}

# Function to install pnpm
function Install-Pnpm {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    refreshenv
}

# Function to restart script with admin rights if needed
function Restart-ScriptAsAdmin {
    if (-not (Test-Admin)) {
        Write-Host "Requesting administrative privileges..." -ForegroundColor Yellow
        Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -WorkingDirectory `"$originalLocation`"" -Verb RunAs
        exit
    }
}

try {
    # Check if node/pnpm need to be installed
    $needsAdmin = (-not (Test-CommandExists node)) -or (-not (Test-CommandExists pnpm))
    if ($needsAdmin) {
        Restart-ScriptAsAdmin
    }

    # Set execution policy for this session only if we're admin
    if (Test-Admin) {
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    }

    # Install required tools
    if (-not (Test-CommandExists refreshenv)) {
        if (-not (Test-Admin)) {
            Write-Host "Administrator privileges required to install Chocolatey. Please run this script as Administrator." -ForegroundColor Yellow
            Restart-ScriptAsAdmin
        }
        Install-Chocolatey
    }

    # Return to project root after potential admin elevation
    Set-Location $projectRoot

    if (-not (Test-CommandExists node)) {
        Install-NodeJS
    }

    # Return to project root
    Set-Location $projectRoot

    if (-not (Test-CommandExists pnpm)) {
        Install-Pnpm
    }

    # Return to project root
    Set-Location $projectRoot

    # Check if git repository needs initialization
    if (-not (Test-GitInitialized)) {
        Write-Host "Initializing Git repository..." -ForegroundColor Yellow
        git init
        git checkout -b main
    } else {
        Write-Host "Git repository already initialized and on main branch." -ForegroundColor Green
    }

    # Install dependencies
    Write-Host "Installing dependencies with pnpm..." -ForegroundColor Yellow
    pnpm install --prod=false

    Write-Host "Setting up development database..." -ForegroundColor Yellow
    # Copy environment file if it doesn't exist
    if (-not (Test-Path (Join-Path $projectRoot ".env.local"))) {
        Copy-Item -Path (Join-Path $projectRoot ".env.example") -Destination (Join-Path $projectRoot ".env.local")
    }
    if (-not (Test-Path (Join-Path $projectRoot ".env"))) {
        Copy-Item -Path (Join-Path $projectRoot ".env.example") -Destination (Join-Path $projectRoot ".env")
    }
    
    # Set up development schema and migrations
    Copy-Item -Path (Join-Path $projectRoot "prisma/schema.dev.prisma") -Destination (Join-Path $projectRoot "prisma/schema.prisma") -Force
    if (Test-Path (Join-Path $projectRoot "prisma/migrations-dev")) {
        $migrationsPath = Join-Path $projectRoot "prisma/migrations"
        if (-not (Test-Path $migrationsPath)) {
            New-Item -ItemType Directory -Path $migrationsPath -Force
        }
        Copy-Item -Path (Join-Path $projectRoot "prisma/migrations-dev/*") -Destination $migrationsPath -Force -Recurse
    }

    # Run migrations and setup
    Set-Location $projectRoot
    pnpm prisma migrate dev
    pnpm prisma db seed
    pnpm prisma generate

    # Display completion message with VS Code debugging instructions
    Write-Host "`nSetup completed successfully!" -ForegroundColor Green
    
    # Display login credentials prominently
    Write-Host "<!> DEFAULT LOGIN CREDENTIALS <!>" -ForegroundColor Yellow
    Write-Host "-------------------------------" -ForegroundColor Yellow
    Write-Host "Email: " -NoNewline -ForegroundColor Cyan
    Write-Host "admin@evoke-ai.co" -ForegroundColor White
    Write-Host "Password: " -NoNewline -ForegroundColor Cyan
    Write-Host "qwerty" -ForegroundColor White
    Write-Host "-------------------------------" -ForegroundColor Yellow
    Write-Host "<!> Please change these credentials in production <!>" -ForegroundColor Yellow

    # Display debugging instructions
    Write-Host "`nTo debug in VS Code:" -ForegroundColor Cyan
    Write-Host "1. Open the project in VS Code: code ." -ForegroundColor White
    Write-Host "2. Press F5 or click the 'Run and Debug' icon in the sidebar" -ForegroundColor White
    Write-Host "3. Select 'Run Web server' from the debug configuration dropdown" -ForegroundColor White
    Write-Host "4. Click the green play button or press F5 to start debugging" -ForegroundColor White

} catch {
    Write-Host "`nAn error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
} finally {
    # Always return to the original location
    Set-Location $originalLocation
}

# Keep the window open at the end
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') 