#!/bin/bash
# Build script for Capacitor - temporarily exclude API routes since they're not needed in static export

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building mobile app (static export)...${NC}"
echo "API routes will be excluded - mobile app will call hosted web API"

# Clean build cache
echo -e "${YELLOW}Cleaning Next.js cache...${NC}"
rm -rf .next

# Temporarily move API directory out of the build
if [ -d "src/app/api" ]; then
  echo -e "${YELLOW}Temporarily moving API routes...${NC}"
  mv src/app/api .api.backup
fi

# Build static export
echo -e "${YELLOW}Building static export...${NC}"
BUILD_TARGET=capacitor npx next build

# Restore API directory
if [ -d ".api.backup" ]; then
  echo -e "${YELLOW}Restoring API routes...${NC}"
  mv .api.backup src/app/api
fi

echo -e "${GREEN}✓ Mobile build complete!${NC}"
echo -e "Next step: Run ${YELLOW}npm run cap:sync${NC} to update the iOS project"
