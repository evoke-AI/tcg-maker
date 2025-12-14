# Read .env file and convert content to environment variable format for docker
$envVars = @()
if (Test-Path .env.prod) {
    Get-Content .env.prod | ForEach-Object {
        if ($_ -match '^[^#]') {  # Skip comments
            # Replace localhost/127.0.0.1 with host.docker.internal in DATABASE_URL
            if ($_ -match '^DATABASE_URL=') {
                $_ = $_ -replace '(sqlserver://)(localhost|127\.0\.0\.1|0\.0\.0\.0)', '$1host.docker.internal'
            }
            $envVars += "-e"
            $envVars += $_
        }
    }
}

# Add extra host mapping for SQL Server access
$extraHosts = "--add-host=host.docker.internal:host-gateway"

# Build the docker image if it doesn't exist
docker build -t web-app-template . 

# Stop and remove existing container if it exists
docker stop web-app-test 2>$null
docker rm web-app-test 2>$null

# Start the container with environment variables and host network access
$dockerArgs = @(
    "run",
    "-d",
    "--name", "web-app-test",
    "-p", "3000:3000",
    $extraHosts
)
$dockerArgs += $envVars
$dockerArgs += "web-app-template"

# Execute docker command
docker $dockerArgs

Write-Host "`nContainer started! The application should be available at http://localhost:3000"
Write-Host "To view logs, run: docker logs -f web-app-test"
Write-Host "To stop the container, run: docker stop web-app-test" 