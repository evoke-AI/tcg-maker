# SonarQube Setup Checklist

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure GitHub Secrets ⚙️
**Location**: Repository Settings → Secrets and variables → Actions

- [ ] Add `SONAR_TOKEN`
  - Value: Generate from SonarQube (My Account → Security → Generate Token)
  - Type: Choose "Global Analysis Token" or "Project Analysis Token"
  - Name suggestion: "GitHub Actions - Evoke One"
  
- [ ] Add `SONAR_HOST_URL`
  - Value: Your SonarQube server URL (e.g., `https://sonarqube.yourcompany.com`)
  - Note: Must include `https://` or `http://`

### Step 2: Test the Setup 🧪

- [ ] Trigger manual workflow
  - Go to: Actions → SonarQube Scan → Run workflow
  - Select: `main` or `develop` branch
  - Click: "Run workflow"

- [ ] Verify workflow runs successfully
  - Check: All three jobs complete (server, flutter, quality-gate)
  - Duration: ~5-10 minutes for first run

- [ ] View results in SonarQube
  - Project 1: `evoke-one-server`
  - Project 2: `evoke-one-flutter`

### Step 3: Team Onboarding 👥

- [ ] Share documentation with team
  - Quick reference: `readme/infrastructure/sonarqube-integration.md`
  - Full guide: `.github/workflows/SONARQUBE_SETUP.md`
  - Summary: `SONARQUBE_SUMMARY.md`

- [ ] Set quality expectations
  - Review quality gate criteria
  - Define issue severity handling
  - Establish PR approval process

- [ ] Configure notifications (optional)
  - Set up email alerts in SonarQube
  - Configure Slack/Teams webhooks
  - Enable PR decoration

## 📋 Pre-Merge Checklist (For Developers)

Before requesting PR review:

- [ ] SonarQube scan completed successfully
- [ ] Quality gate: **PASSED** ✅
- [ ] Zero blocker or critical issues introduced
- [ ] Code coverage maintained or improved
- [ ] No new security vulnerabilities
- [ ] Review and address code smells

## 🔍 Troubleshooting Checklist

If the workflow fails, check:

### Authentication Issues
- [ ] `SONAR_TOKEN` secret is set correctly
- [ ] Token hasn't expired (check SonarQube)
- [ ] Token has appropriate permissions

### Connection Issues
- [ ] `SONAR_HOST_URL` includes protocol (https://)
- [ ] URL doesn't have trailing slash
- [ ] SonarQube server is accessible from GitHub Actions

### Project Issues
- [ ] Projects exist in SonarQube (or auto-create enabled)
- [ ] Project keys match: `evoke-one-server`, `evoke-one-flutter`

### Workflow Issues
- [ ] Workflow file syntax is valid
- [ ] All required files exist (sonar-project.properties)
- [ ] No conflicting workflows running

## 🎯 Quality Gate Checklist

Ensure your code meets these standards:

### Reliability
- [ ] Zero new bugs on new code
- [ ] Reliability rating: A or B

### Security
- [ ] Zero new vulnerabilities
- [ ] Security rating: A
- [ ] All security hotspots reviewed

### Maintainability
- [ ] Code smells: Acceptable level
- [ ] Technical debt: < 5% of development time
- [ ] Maintainability rating: A or B

### Coverage
- [ ] Line coverage on new code: ≥ 80%
- [ ] Branch coverage maintained or improved

### Duplication
- [ ] Duplicated lines: ≤ 3%

## 📊 Regular Maintenance Checklist

### Weekly Tasks
- [ ] Review new issues and trends
- [ ] Address security hotspots
- [ ] Check coverage metrics

### Monthly Tasks
- [ ] Review quality trends
- [ ] Update exclusion patterns if needed
- [ ] Clean up false positives

### Quarterly Tasks
- [ ] Review quality gate settings
- [ ] Update documentation
- [ ] Rotate SONAR_TOKEN (if policy requires)
- [ ] Team training on new issues/patterns

## 🔐 Security Checklist

### Token Management
- [ ] SONAR_TOKEN stored only in GitHub Secrets
- [ ] Token has minimal required permissions
- [ ] Token expiration policy in place
- [ ] Document token rotation process

### Access Control
- [ ] SonarQube projects have appropriate permissions
- [ ] Quality gate modification restricted to admins
- [ ] Audit logs reviewed regularly

## 📚 Documentation Checklist

Ensure these files are up to date:

- [x] `.github/workflows/sonarqube-scan.yml` - Main workflow
- [x] `.github/workflows/SONARQUBE_SETUP.md` - Setup guide
- [x] `.github/workflows/SONARQUBE_CHECKLIST.md` - This checklist
- [x] `readme/infrastructure/sonarqube-integration.md` - Quick reference
- [x] `readme/infrastructure/structure.md` - Architecture docs
- [x] `SONARQUBE_SUMMARY.md` - Overview
- [x] `sonar-project.properties` - Root config
- [x] `server/sonar-project.properties` - Server config
- [x] `app/sonar-project.properties` - Flutter config

## 🎓 Team Training Checklist

New team members should:

- [ ] Read `SONARQUBE_SUMMARY.md` for overview
- [ ] Review `sonarqube-integration.md` for day-to-day usage
- [ ] Understand quality gate criteria
- [ ] Know how to view results in SonarQube dashboard
- [ ] Practice fixing common issues on test branch
- [ ] Understand PR approval process

## ✅ Go-Live Checklist

Before requiring SonarQube for all PRs:

- [ ] All secrets configured
- [ ] Workflow tested on multiple branches
- [ ] Quality gate thresholds validated
- [ ] Documentation complete and shared
- [ ] Team trained and onboarded
- [ ] False positives configured
- [ ] Exclusion patterns validated
- [ ] Backup scan process documented
- [ ] Support contact established

## 🚨 Emergency Checklist

If SonarQube is blocking critical releases:

1. **Assess the situation**
   - [ ] Review blocker/critical issues
   - [ ] Determine if issues are valid
   - [ ] Estimate time to fix

2. **Short-term options**
   - [ ] Fix critical issues immediately
   - [ ] Request quality gate override (with approval)
   - [ ] Create hotfix plan

3. **Long-term actions**
   - [ ] Document why override was needed
   - [ ] Create follow-up tasks to address issues
   - [ ] Review quality gate settings
   - [ ] Update team guidelines

## 📞 Support Contacts

| Issue Type | Contact |
|------------|---------|
| SonarQube server issues | DevOps Team |
| Quality gate questions | Tech Lead |
| Workflow failures | DevOps Team |
| False positives | Code Review Team |
| Training requests | Team Lead |

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| GitHub Actions | `https://github.com/[org]/[repo]/actions` |
| SonarQube Dashboard | `$SONAR_HOST_URL` |
| Setup Guide | `.github/workflows/SONARQUBE_SETUP.md` |
| Quick Reference | `readme/infrastructure/sonarqube-integration.md` |
| Workflow File | `.github/workflows/sonarqube-scan.yml` |

---

**Last Updated**: October 2025  
**Version**: 1.0  
**Maintained By**: DevOps Team

