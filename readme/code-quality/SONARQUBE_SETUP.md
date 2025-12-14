# SonarQube GitHub Actions Setup Guide

This document explains the SonarQube integration for the Evoke One Mobile project.

## Overview

The SonarQube scan workflow analyzes both parts of our monorepo:
- **Next.js Server** (`server/` directory)
- **Flutter Mobile App** (`app/` directory)

## Prerequisites

Before the workflow can run successfully, you need to configure the following GitHub Secrets:

### Required GitHub Secrets

1. **`SONAR_TOKEN`**
   - Description: Authentication token for SonarQube
   - How to obtain:
     1. Log into your SonarQube instance
     2. Go to **My Account** → **Security**
     3. Generate a new token with appropriate permissions
     4. Copy the token immediately (it won't be shown again)
   
2. **`SONAR_HOST_URL`**
   - Description: URL of your SonarQube server
   - Format: `https://your-sonarqube-instance.com`
   - Example: `https://sonarqube.example.com` or `http://localhost:9000` for local instances

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value as described above

## Workflow Configuration

### Trigger Events

The workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull requests** (opened, synchronized, or reopened)
- **Manual trigger** via workflow dispatch

### Jobs

#### 1. `sonarqube-server`
Analyzes the Next.js server codebase:
- Installs Node.js and pnpm
- Runs ESLint analysis
- Scans TypeScript/JavaScript code
- Generates code quality metrics

**Project Key**: `evoke-one-server`

#### 2. `sonarqube-flutter`
Analyzes the Flutter mobile app:
- Sets up Flutter environment
- Runs `flutter analyze`
- Executes tests with coverage
- Scans Dart code

**Project Key**: `evoke-one-flutter`

#### 3. `sonarqube-quality-gate`
Checks quality gate status for both projects:
- Waits for SonarQube analysis to complete
- Validates code quality standards
- Reports results in GitHub Actions summary

## SonarQube Project Configuration

### Server Project (`evoke-one-server`)

**Included directories:**
- `app/` - Next.js pages and API routes
- `lib/` - Utility libraries
- `components/` - React components
- `i18n/` - Internationalization

**Excluded:**
- `node_modules/`
- Test files (`*.spec.ts`, `*.test.ts`)
- Build artifacts (`build/`, `dist/`, `.next/`)
- Prisma migrations
- Temporary files

### Flutter Project (`evoke-one-flutter`)

**Included directories:**
- `lib/` - Main Dart source code

**Excluded:**
- Generated files (`*.g.dart`, `*.freezed.dart`)
- Build artifacts (`build/`, `.dart_tool/`)
- Generated code directories

## Coverage Reports

### Server Coverage
To generate coverage reports for the Next.js server:

```bash
cd server
pnpm test -- --coverage
```

This creates `coverage/lcov.info` which SonarQube uses for coverage analysis.

### Flutter Coverage
To generate coverage for Flutter:

```bash
cd app
flutter test --coverage
```

This creates `coverage/lcov.info` in the app directory.

## Local SonarQube Analysis

You can run SonarQube analysis locally using the SonarScanner CLI:

### Install SonarScanner

**Windows (with Chocolatey):**
```bash
choco install sonarscanner
```

**Mac (with Homebrew):**
```bash
brew install sonar-scanner
```

**Linux:**
Download from [SonarScanner Downloads](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)

### Run Local Scan

**Server:**
```bash
cd server
sonar-scanner \
  -Dsonar.projectKey=evoke-one-server \
  -Dsonar.sources=. \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.login=$SONAR_TOKEN
```

**Flutter:**
```bash
cd app
sonar-scanner \
  -Dsonar.projectKey=evoke-one-flutter \
  -Dsonar.sources=. \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.login=$SONAR_TOKEN
```

## Quality Gate Configuration

### Recommended Quality Gate Settings

In your SonarQube instance, configure the quality gate with:

**Coverage:**
- Overall Coverage: ≥ 80%
- New Code Coverage: ≥ 80%

**Reliability:**
- Bugs: = 0 on new code
- Reliability Rating: ≤ A

**Security:**
- Vulnerabilities: = 0 on new code
- Security Rating: ≤ A
- Security Hotspots Reviewed: = 100%

**Maintainability:**
- Code Smells: ≤ 10 on new code
- Maintainability Rating: ≤ A
- Technical Debt Ratio: ≤ 5%

**Duplication:**
- Duplicated Lines: ≤ 3%

## Troubleshooting

### Issue: "Could not find a default branch"
**Solution:** Ensure your repository has a main or master branch with at least one commit.

### Issue: "Quality gate timeout"
**Solution:** Increase the timeout in the quality gate check step or check SonarQube server performance.

### Issue: "Analysis failed: Not authorized"
**Solution:** Verify that:
- `SONAR_TOKEN` is correctly set in GitHub Secrets
- The token has appropriate permissions in SonarQube
- The token hasn't expired

### Issue: "Project not found"
**Solution:** 
- Create the projects manually in SonarQube first, or
- Allow SonarQube to auto-create projects (requires administrator permission)

### Issue: "Coverage report not found"
**Solution:** Ensure tests are run with `--coverage` flag before the SonarQube scan step.

## Best Practices

1. **Run tests before scanning**: Always ensure your test suite runs successfully before SonarQube analysis.

2. **Review quality gate failures**: Don't ignore quality gate failures - they indicate code quality issues that should be addressed.

3. **Configure branch analysis**: Set up branch analysis patterns in SonarQube to track quality across different branches.

4. **Use pull request decoration**: Enable pull request decoration in SonarQube to see analysis results directly in GitHub PRs.

5. **Regularly update exclusions**: Keep the exclusion patterns up to date as your project structure evolves.

6. **Monitor technical debt**: Use SonarQube's technical debt metrics to track and reduce code complexity over time.

## Additional Resources

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [SonarQube GitHub Action](https://github.com/marketplace/actions/official-sonarqube-scan)
- [Flutter SonarQube Integration](https://docs.sonarqube.org/latest/analysis/languages/dart/)
- [TypeScript SonarQube Integration](https://docs.sonarqube.org/latest/analysis/languages/typescript/)

## Support

For issues with the SonarQube integration, please:
1. Check the GitHub Actions logs for detailed error messages
2. Review the SonarQube server logs
3. Consult the SonarQube documentation
4. Contact your DevOps team or project maintainers

