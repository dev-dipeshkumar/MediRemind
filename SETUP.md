# Smart Medicine Reminder - Setup Instructions

## Project Overview

This is an Internet Computer Protocol (ICP) application for medicine reminders, built with:
- **Backend**: Motoko language running on ICP canisters
- **Frontend**: React + TypeScript + Vite
- **Package Manager**: pnpm (required, not npm)
- **UI Components**: Radix UI + Tailwind CSS

## Prerequisites

### Required Software

1. **Node.js** >= 16.0.0 (Node 20.x recommended)
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   nvm install 20
   nvm use 20
   ```

2. **pnpm** >= 7.0.0
   ```bash
   # Install globally
   npm install -g pnpm@latest
   
   # Verify installation
   pnpm --version
   ```

3. **icp-cli** (Internet Computer CLI)
   ```bash
   # Install via curl
   curl --proto '=https' --tlsv1.2 -LsSf https://github.com/dfinity/icp-cli/releases/download/v0.1.0-beta.3/icp-cli-installer.sh | sh
   
   # Or via cargo if you have Rust installed
   cargo install icp-cli
   ```

4. **Motoko Compiler** (for backend)
   - The project uses Motoko version 1.2.0
   - Can be installed via the Dockerfile process or manually from [caffeinelabs/motoko releases](https://github.com/caffeinelabs/motoko/releases)

## Installation Steps

### 1. Clone and Navigate to Project

```bash
cd /workspace
```

### 2. Install Dependencies

```bash
# Install root workspace dependencies
pnpm install

# This will also install dependencies for all workspace packages including frontend
```

### 3. Build the Project

#### Option A: Using build script (Recommended)

```bash
chmod +x build.sh
./build.sh
```

This script will:
- Install all dependencies
- Build the frontend
- Process images (prune unused, resize)
- Compile the Motoko backend to WASM

#### Option B: Manual build steps

```bash
# Install dependencies
pnpm install

# Build frontend only
pnpm --filter '@caffeine/template-frontend' build

# Compile backend (requires Motoko compiler)
# See build.sh for the exact moc command with proper flags
```

### 4. Local Development

#### Start ICP Local Network

```bash
# Start the local replica
icp network start -d
```

#### Create Canisters

```bash
# Create frontend canister
icp canister create --environment local frontend

# Create backend canister
icp canister create --environment local backend

# Get backend canister ID (needed for frontend configuration)
export BACKEND_CANISTER_ID=$(icp canister settings show --environment local --id-only backend)
```

#### Set Environment Variables

Create or update environment variables for local development:

```bash
export BACKEND_CANISTER_ID=<your-backend-canister-id>
export STORAGE_GATEWAY_URL=http://localhost:6188
export II_URL=http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8000
```

#### Deploy to Local Network

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Start the local ICP network if not running
- Create canisters
- Deploy both frontend and backend
- Keep the network running (press Ctrl+C to stop)

### 5. Frontend Development Server

If you want to run the frontend in development mode:

```bash
cd src/frontend

# Start Vite dev server
pnpm dev
```

Note: You'll need to configure the backend canister ID in your environment for the frontend to connect properly.

## Project Structure

```
/workspace
├── src/
│   ├── backend/           # Motoko backend code
│   │   ├── main.mo        # Main canister implementation
│   │   ├── authorization/ # Authorization mixins
│   │   └── http-outcalls/ # HTTP outcall functionality
│   └── frontend/          # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   └── utils/
│       └── package.json
├── scripts/               # Utility scripts
├── build.sh              # Build automation
├── deploy.sh             # Deployment automation
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # PNPM workspace config
└── icp.yaml             # ICP deployment config
```

## Available Commands

### Root Level

```bash
pnpm build        # Build all packages
pnpm typecheck    # Run TypeScript type checking
pnpm check        # Run Biome linter
pnpm fix          # Auto-fix linting issues
```

### Frontend (`src/frontend`)

```bash
pnpm build                 # Build for production
pnpm build:skip-bindings   # Build without regenerating bindings
pnpm dev                   # Start development server
pnpm typecheck            # Type check
pnpm check                # Lint check
pnpm fix                  # Auto-fix lint issues
```

## Docker Deployment

The project includes a `Dockerfile` for containerized builds and deployments:

```bash
# Build Docker image
docker build -t smart-medicine-reminder .

# Run deployment
docker run --rm smart-medicine-reminder
```

The Docker image includes:
- Node.js 20.x with pnpm
- Motoko compiler 1.2.0
- ICP CLI tools
- All necessary build dependencies

## Troubleshooting

### Common Issues

1. **"pnpm: command not found"**
   ```bash
   npm install -g pnpm
   ```

2. **"icp: command not found"**
   - Ensure `~/.cargo/bin` is in your PATH
   - Reinstall icp-cli if needed

3. **Motoko compilation errors**
   - Verify MOC_PATH environment variable is set correctly
   - Check that Motoko core library is installed

4. **Frontend build fails**
   - Clear node_modules: `rm -rf node_modules src/frontend/node_modules`
   - Reinstall: `pnpm install`
   - Try building with verbose output: `pnpm build --verbose`

5. **Canister creation fails**
   - Ensure local network is running: `icp network start -d`
   - Check for port conflicts on default ICP ports (8000, 6188, etc.)

## Additional Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs/)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/developer-docs/build/motoko/)
- [ICP CLI Reference](https://github.com/dfinity/icp-cli)
- [Caffeine Platform](https://caffeine.ai/)

## License

See LICENSE file for terms and conditions.
