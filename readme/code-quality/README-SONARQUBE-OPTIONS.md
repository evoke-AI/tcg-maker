# SonarQube Configuration Options

## Current Setup: Two Separate Projects (Recommended) ✅

The current workflow creates **two separate projects** in SonarQube:
- `{repo-name}-server` - For Next.js backend
- `{repo-name}-mobile` - For Flutter app

### Advantages
✅ **Clear separation of concerns** - Each project has its own dashboard  
✅ **Independent quality gates** - Server and mobile can have different standards  
✅ **Better organization** - Easy to see which part has issues  
✅ **Team-specific views** - Backend team vs Mobile team  
✅ **Granular permissions** - Different access control per project  
✅ **Better trending** - Track quality improvements separately  

### Disadvantages
⚠️ **More projects in SonarQube** - Could get messy with many repos  
⚠️ **Need to check two dashboards** - To see overall project health  

---

## Alternative: Single Unified Project (Not Recommended)

You **can** combine both scans into a single project, but it has significant drawbacks:

### How to Implement (If You Really Want To)

Replace the two scan jobs in `sonarqube-scan.yml` with a single combined scan:

```yaml
  sonarqube-unified:
    name: SonarQube - Unified Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Server setup
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9.4.0

      - name: Install Server Dependencies
        working-directory: ./server
        run: pnpm install

      - name: TypeScript Type Check
        working-directory: ./server
        continue-on-error: true
        run: npx tsc --noEmit --pretty || true

      - name: Run ESLint for Server
        working-directory: ./server
        continue-on-error: true
        run: pnpm lint --output-file eslint-report.json --format json || true

      # Flutter setup
      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version-file: app/pubspec.yaml
          channel: 'stable'

      - name: Get Flutter dependencies
        working-directory: ./app
        run: flutter pub get

      - name: Generate localization files
        working-directory: ./app
        run: flutter gen-l10n

      - name: Run Flutter Analyze
        working-directory: ./app
        continue-on-error: true
        run: flutter analyze > flutter-analyze-report.txt || true

      - name: Run Flutter Tests with Coverage
        working-directory: ./app
        continue-on-error: true
        run: flutter test --coverage || true

      - name: Set Repository Name
        id: repo-name
        run: |
          REPO_NAME=$(echo ${{ github.repository }} | cut -d'/' -f2)
          echo "repo_name=$REPO_NAME" >> $GITHUB_OUTPUT

      # Unified scan with module configuration
      - name: SonarQube Unified Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        with:
          args: >
            -Dsonar.projectKey=${{ steps.repo-name.outputs.repo_name }}
            -Dsonar.projectName=${{ steps.repo-name.outputs.repo_name }}
            -Dsonar.modules=server,mobile
            -Dsonar.server.projectBaseDir=server
            -Dsonar.server.sources=app,lib,components,i18n
            -Dsonar.server.exclusions=**/node_modules/**,**/*.spec.ts,**/*.test.ts,**/build/**,**/dist/**,**/.next/**
            -Dsonar.server.typescript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.server.eslint.reportPaths=eslint-report.json
            -Dsonar.mobile.projectBaseDir=app
            -Dsonar.mobile.sources=lib
            -Dsonar.mobile.exclusions=**/*.g.dart,**/*.freezed.dart,**/generated/**,**/build/**
            -Dsonar.mobile.dart.coverage.reportPath=coverage/lcov.info
```

### Disadvantages of Single Project
❌ **Mixed metrics** - Can't see server vs mobile quality separately  
❌ **Confusing dashboards** - TypeScript + Dart mixed together  
❌ **One quality gate for both** - Can't have different standards  
❌ **Harder to track trends** - Which part improved or degraded?  
❌ **Complex configuration** - Module setup is more complicated  
❌ **Permission issues** - Can't give team-specific access  
❌ **Difficult debugging** - Harder to trace issues to source  

### Why It's Not Recommended

1. **Different Languages**: TypeScript vs Dart have different rules and standards
2. **Different Teams**: Backend and mobile teams have different workflows
3. **Different Quality Standards**: Server might need higher coverage than mobile
4. **Different Update Cycles**: Server and mobile might release separately
5. **SonarQube Best Practices**: Recommends separate projects for different codebases

---

## Addressing Your Concerns

### "Project list would be messy with lots of projects"

**Solutions:**

#### 1. Use SonarQube Project Portfolios (Recommended)
Create a portfolio/application that groups related projects:

```
Evoke One Application
├── evoke-one-mobile-server
└── evoke-one-mobile-mobile
```

In SonarQube:
- Go to **Administration** → **Projects** → **Management**
- Create an **Application** or **Portfolio**
- Group `{repo}-server` and `{repo}-mobile` together
- View consolidated metrics in one dashboard

#### 2. Use Naming Conventions
The current setup uses consistent naming:
- `{repo-name}-server`
- `{repo-name}-mobile`

This makes it easy to:
- Search/filter by repository name
- Sort alphabetically to see related projects together
- Use SonarQube tags to group projects

#### 3. Use SonarQube Tags
Add tags in the workflow:
```yaml
-Dsonar.projectKey=${{ steps.repo-name.outputs.repo_name }}-server
-Dsonar.projectName=${{ steps.repo-name.outputs.repo_name }}-server
-Dsonar.tags=server,backend,${{ steps.repo-name.outputs.repo_name }}
```

Then filter by tags in SonarQube UI.

#### 4. Archive Old Projects
In SonarQube, you can archive projects that are no longer active:
- Keeps project list clean
- Historical data still available
- Can be reactivated if needed

---

## What We Enhanced

### 1. Better Linting for Next.js ✅

**Before:**
```yaml
- name: Run ESLint for Server
  run: pnpm lint --output-file eslint-report.json --format json || true
```

**After:**
```yaml
- name: TypeScript Type Check
  run: npx tsc --noEmit --pretty || true  # ← NEW: Full TypeScript checking

- name: Run ESLint for Server
  run: pnpm lint --output-file eslint-report.json --format json || true
```

**Benefits:**
- ✅ **TypeScript type checking** - Catches type errors that ESLint misses
- ✅ **Unused imports/variables** - TypeScript compiler catches these
- ✅ **Type inference issues** - Ensures proper typing throughout codebase
- ✅ **Interface/type errors** - Validates all type definitions
- ✅ **Better error reporting** - SonarQube gets more comprehensive data

### 2. Dynamic Project Names ✅

**Before:**
```yaml
-Dsonar.projectKey=evoke-one-server  # Hardcoded
```

**After:**
```yaml
- name: Set Repository Name
  id: repo-name
  run: |
    REPO_NAME=$(echo ${{ github.repository }} | cut -d'/' -f2)
    echo "repo_name=$REPO_NAME" >> $GITHUB_OUTPUT

-Dsonar.projectKey=${{ steps.repo-name.outputs.repo_name }}-server  # Dynamic
```

**Benefits:**
- ✅ **Template-ready** - Works for any repository
- ✅ **No manual changes** - Copy workflow, it just works
- ✅ **Consistent naming** - Always follows pattern
- ✅ **Maintainable** - One workflow for all projects

**How it works:**
- Repository: `evoke-ai/my-awesome-app`
- Extracts: `my-awesome-app`
- Creates: `my-awesome-app-server` and `my-awesome-app-mobile`

---

## Recommendations

### For Small Teams (1-5 repos)
✅ **Use separate projects** (current setup)  
- Easy to manage
- Clear separation
- Best for learning and quality tracking

### For Medium Teams (5-20 repos)
✅ **Use separate projects + SonarQube Applications**  
- Group related projects into Applications
- Get consolidated metrics when needed
- Maintain granular control

### For Large Teams (20+ repos)
✅ **Use separate projects + Portfolios + Tags**  
- Organize by team/domain using portfolios
- Tag projects for filtering
- Archive inactive projects
- Use SonarQube's governance features

---

## Migration Guide

### If You Want to Switch to Unified Project

1. **Backup current data** in SonarQube
2. **Delete existing projects**: `{repo}-server` and `{repo}-mobile`
3. **Replace workflow** with unified version above
4. **Update quality gates** for combined metrics
5. **Test thoroughly** before rolling out

### If You Want Better Organization (Recommended)

1. **Keep current setup** (separate projects)
2. **Create Application in SonarQube**:
   - Go to Administration → Projects → Management
   - Click "Create Application"
   - Name: Same as repository name
   - Add: Both `-server` and `-mobile` projects
3. **Add tags** to projects:
   - Add workflow parameter: `-Dsonar.tags=your-tag`
4. **Use Applications view** for consolidated metrics

---

## Conclusion

**We recommend keeping the current setup** (two separate projects) because:

1. ✅ Better organization and clarity
2. ✅ Independent quality tracking
3. ✅ Team-specific dashboards
4. ✅ SonarQube Applications can consolidate when needed
5. ✅ Follows SonarQube best practices
6. ✅ More flexible for future growth

**The "messy project list" concern is solved by:**
- Consistent naming convention (`{repo}-server`, `{repo}-mobile`)
- SonarQube Applications/Portfolios for grouping
- Tags for filtering
- Archiving old/inactive projects

**You get the best of both worlds:**
- Detailed, separate metrics for each codebase
- Consolidated view when needed via Applications
- Clean, organized project list with proper naming

---

## Questions?

Need help deciding? Consider:
- How many repositories do you have?
- Do backend and mobile teams work separately?
- Do you need different quality standards for each?
- How do you want to track quality over time?

For 99% of cases, **separate projects (current setup) is the right choice**. 🎯

