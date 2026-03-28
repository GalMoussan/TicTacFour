#!/bin/bash

# E2E Test Setup Verification Script
# Checks that all E2E test infrastructure is properly installed

echo "🎭 Verifying E2E Test Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ((ERRORS++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ - MISSING"
        ((ERRORS++))
    fi
}

echo "1. Checking Playwright installation..."
if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
    VERSION=$(npx playwright --version)
    echo -e "${GREEN}✓${NC} Playwright installed: $VERSION"
else
    echo -e "${RED}✗${NC} Playwright not installed"
    ((ERRORS++))
fi
echo ""

echo "2. Checking Playwright config..."
check_file "playwright.config.ts"
echo ""

echo "3. Checking test directory structure..."
check_dir "tests/e2e"
check_dir "tests/e2e/helpers"
echo ""

echo "4. Checking test files..."
check_file "tests/e2e/layout.spec.ts"
check_file "tests/e2e/single-player.spec.ts"
check_file "tests/e2e/multiplayer.spec.ts"
check_file "tests/e2e/room-management.spec.ts"
echo ""

echo "5. Checking helper files..."
check_file "tests/e2e/helpers/page-objects.ts"
check_file "tests/e2e/helpers/test-helpers.ts"
echo ""

echo "6. Checking documentation..."
check_file "tests/e2e/README.md"
check_file "tests/e2e/QUICK_START.md"
check_file "tests/e2e/TEST_SUMMARY.md"
check_file "tests/e2e/DATA_TESTID_CHECKLIST.md"
echo ""

echo "7. Checking CI/CD workflow..."
check_file ".github/workflows/e2e-tests.yml"
echo ""

echo "8. Checking package.json scripts..."
if grep -q "test:e2e" package.json; then
    echo -e "${GREEN}✓${NC} E2E scripts present in package.json"
else
    echo -e "${RED}✗${NC} E2E scripts missing in package.json"
    ((ERRORS++))
fi
echo ""

echo "9. Counting tests..."
if [ -d "tests/e2e" ]; then
    TEST_COUNT=$(grep -r "^test\(" tests/e2e/*.spec.ts | wc -l | xargs)
    echo -e "${GREEN}✓${NC} Found $TEST_COUNT tests"
else
    echo -e "${RED}✗${NC} Cannot count tests"
    ((ERRORS++))
fi
echo ""

echo "10. Checking Chromium installation..."
if npx playwright install --dry-run chromium 2>&1 | grep -q "is already installed"; then
    echo -e "${GREEN}✓${NC} Chromium browser installed"
else
    echo -e "${YELLOW}!${NC} Chromium browser may not be installed"
    echo "   Run: npx playwright install chromium"
fi
echo ""

echo "=================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Add data-testid attributes (see DATA_TESTID_CHECKLIST.md)"
    echo "2. Start dev server: npm run dev"
    echo "3. Run tests: npm run test:e2e"
    echo ""
    echo "Quick reference: tests/e2e/QUICK_START.md"
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    echo ""
    echo "Please fix the errors above before running tests."
fi
echo "=================================================="
