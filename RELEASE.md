# pyMC UI Release Process

## Automated Build & Release

This project uses GitHub Actions to automatically build and release the static UI files.

## Creating a Release

### 1. Update Version
```bash
# In pymc_alt-ui/frontend/
npm version patch  # or minor, or major
```

### 2. Push with Tags
```bash
git push origin dev
git push origin --tags
```

### 3. GitHub Actions Workflow
The workflow automatically:
- ✅ Builds static files on every push to `main`/`dev`
- ✅ Creates versioned archives (`.tar.gz` and `.zip`)
- ✅ Uploads build artifacts (available for 30 days)
- ✅ Creates GitHub Release when you push a version tag (e.g., `v0.1.1`)

## Manual Build

```bash
cd pymc_alt-ui/frontend
npm run build:static
```

The static files will be in `dist/` folder, ready to deploy.

## Deployment

Users can download the release archives from GitHub Releases and extract them to their preferred static file location. The backend should be configured to serve files from that location.

### Example Deployment
```bash
# Download release
wget https://github.com/rightup/pyMC_Repeater/releases/download/v0.1.1/pymc-ui-v0.1.1.tar.gz

# Extract to your static files directory
tar -xzf pymc-ui-v0.1.1.tar.gz -C /path/to/static/files/
```

## Version Tagging Convention

- `v0.1.0` - Major release
- `v0.1.1` - Bug fix
- `v0.2.0` - New features
- `v1.0.0-beta.1` - Pre-release (marked as prerelease on GitHub)
