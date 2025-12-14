# Store the original working directory
$originalLocation = Get-Location

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

# Function to install Git
function Install-Git {
    Write-Host "Installing Git..." -ForegroundColor Yellow
    winget install Git.Git
    
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
    # Check if git needs to be installed
    if (-not (Test-CommandExists git)) {
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

    # Return to original directory after potential admin elevation
    Set-Location $originalLocation

    if (-not (Test-CommandExists git)) {
        Install-Git
    }

    # Return to original directory
    Set-Location $originalLocation

    # Get zip URL
    $zipUrl = "https://evokeai.blob.core.windows.net/dist/web-app-template-main.zip"

    # Get project name from user
    $projectName = Read-Host -Prompt 'Enter the name for your new project'

    # Create temporary directory for zip download and extraction
    $tempDir = Join-Path $env:TEMP "temp_project"
    $tempZip = Join-Path $env:TEMP "temp_project.zip"

    # Create temp directory if it doesn't exist
    New-Item -ItemType Directory -Path $tempDir -Force

    # Download the zip file
    Write-Host "Downloading project template..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip

    # Extract zip to temp directory first
    Write-Host "Extracting files..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

    # Create the final project directory
    $projectPath = Join-Path $originalLocation $projectName

    # Find the template directory inside the extracted files (usually web-app-template-main)
    $templateDir = Get-ChildItem -Path $tempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1

    # Move the contents to the project directory
    New-Item -ItemType Directory -Path $projectPath -Force
    Copy-Item -Path "$($templateDir.FullName)\*" -Destination $projectPath -Recurse -Force

    # Clean up temporary files
    Remove-Item -Path $tempZip -Force
    Remove-Item -Path $tempDir -Recurse -Force

    # Navigate to project directory
    Set-Location $projectPath

    # Initialize git repository
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init

    Write-Host "`nProject template downloaded successfully!" -ForegroundColor Green
    Write-Host "Running setup script..." -ForegroundColor Yellow
    
    # Run the setup script if it exists
    if (Test-Path "setup-project.ps1") {
        & .\setup-project.ps1
    } else {
        Write-Host "Setup script not found. Please run setup manually." -ForegroundColor Red
    }

} catch {
    Write-Host "`nAn error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

# Keep the window open at the end
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') 