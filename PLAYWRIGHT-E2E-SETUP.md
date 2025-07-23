# E2E Testing Setup for toico

This document describes the end-to-end testing setup for the SVG to ICO converter application using Playwright.

## Installation and Setup

### Dependencies Installed
- `@playwright/test` - Main Playwright testing framework
- `playwright` - Browser automation library

### Configuration
- **Config file**: `playwright.config.ts`
- **Test directory**: `tests/`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Dev server**: Automatically starts on `http://localhost:3000`

## Test Structure

### Test Files
1. **`tests/basic.spec.ts`** - Basic page load and UI visibility tests
2. **`tests/conversion-happy-path.spec.ts`** - Complete conversion workflow tests
3. **`tests/error-handling.spec.ts`** - Error scenarios and edge cases
4. **`tests/ui-interactions.spec.ts`** - User interface interaction tests

### Test Fixtures
- **`tests/fixtures/test-icon.svg`** - Simple 256x256 SVG for basic testing
- **`tests/fixtures/large-icon.svg`** - Complex 512x512 SVG for performance testing
- **`tests/fixtures/invalid.svg`** - Malformed SVG for error testing

### Helper Utilities
- **`tests/helpers.ts`** - `ConversionPage` class with reusable test methods
  - File upload via input and drag-and-drop
  - Preview generation waiting
  - Conversion completion waiting
  - Download handling
  - Error assertion helpers

## Test Scenarios Covered

### Happy Path Tests
- [x] Page loads with correct title and header
- [x] File upload and preview generation
- [x] Automatic conversion to ICO format
- [x] File download functionality
- [x] Large file handling
- [x] Custom size selection
- [x] State management during conversion

### Error Handling Tests
- [x] Invalid SVG file handling
- [x] Unsupported file type rejection
- [x] File size limit enforcement
- [x] Conversion timeout handling
- [x] Error state clearing on new upload
- [x] Prevention of multiple simultaneous conversions
- [x] Empty file selection handling

### UI Interaction Tests
- [x] Drag and drop file upload
- [x] Click-to-upload functionality
- [x] File information display
- [x] Preview size toggling
- [x] Loading state indicators
- [x] Responsive design on mobile
- [x] Keyboard navigation
- [x] Preview image sizing
- [x] Success feedback

## Component Test IDs Added

The following `data-testid` attributes were added to components for reliable testing:

### FileUploader Component
- `file-drop-zone` - Main drag-and-drop area
- `file-info` - File information display
- `file-format` - Format detection display
- `error-message` - Error message container

### Preview Component
- `loading-previews` - Loading indicator during conversion
- `preview-container` - Container for all preview images
- `preview-{size}` - Individual preview containers (e.g., `preview-256`)
- `preview-image` - Individual preview images
- `size-checkbox-{size}` - Size selection checkboxes
- `conversion-success` - Success indicator wrapper
- `download-button` - ICO download button

## Running Tests

### NPM Scripts Added
```bash
# Run all tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### Manual Commands
```bash
# Run specific test file
npx playwright test tests/basic.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

## CI/CD Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/e2e-tests.yml`
- **Triggers**: Push to main/develop, PRs to main/develop
- **Steps**:
  1. Install dependencies
  2. Install Playwright browsers
  3. Build application
  4. Run tests
  5. Upload test reports as artifacts

### Test Environment
- **Node.js**: Version 18
- **OS**: Ubuntu latest
- **Timeout**: 60 minutes
- **Artifacts**: Playwright HTML reports (30-day retention)

## Key Features

### Automatic Conversion Detection
The tests are designed around the app's automatic conversion behavior:
- Conversion starts automatically after file upload and preview generation
- No separate "convert" button - tests wait for conversion completion
- Size changes trigger re-conversion automatically

### File Upload Testing
- Both programmatic file input and drag-and-drop simulation
- Proper MIME type and file extension validation
- File size limit testing

### Error Resilience
- Timeout protection for all async operations
- Graceful handling of conversion failures
- Proper error message validation

### Cross-Browser Compatibility
- Tests run on multiple browsers and mobile viewports
- Responsive design validation
- Touch-friendly interface testing

## Development Notes

### Browser Installation Issues
If you encounter browser installation issues, ensure Playwright browsers are properly installed:
```bash
npx playwright install-deps
npx playwright install
```

### Test Data Management
- Test fixtures are stored in `tests/fixtures/`
- Temporary files are cleaned up automatically
- No external dependencies or API calls

### Debugging Tests
- Use `--debug` flag for step-by-step debugging
- Screenshots are taken on failure
- Trace files are generated for failed tests
- HTML report provides detailed test results

## Future Enhancements

Potential areas for additional testing:
- Performance testing with very large files
- Accessibility testing (ARIA labels, keyboard navigation)
- File format support expansion
- Multi-file upload scenarios
- Advanced error recovery scenarios