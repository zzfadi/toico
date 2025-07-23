# E2E Testing with Playwright

This directory contains end-to-end tests for the Universal Image to ICO Converter application using Playwright.

## Test Structure

- `basic.spec.ts` - Basic application functionality and page load tests
- `upload.spec.ts` - File upload functionality tests  
- `conversion.spec.ts` - Image to ICO conversion tests
- `ui-interactions.spec.ts` - UI responsiveness and interaction tests
- `error-handling.spec.ts` - Error scenarios and edge cases
- `performance.spec.ts` - Performance and load time tests

## Test Fixtures

- `fixtures/images/` - Sample image files for testing different formats
- `fixtures/helpers/` - Test helper utilities for common operations

## Running Tests

```bash
# Install Playwright browsers (first time only)
npm run test:e2e:install

# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Configuration

Tests are configured in `playwright.config.ts` with:

- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile and desktop viewports
- Automatic retry on failure
- Screenshot and video capture on failure
- HTML and JUnit test reports

## CI Integration

Tests run automatically on:
- Pull requests to main/develop branches
- Pushes to main/develop branches

See `.github/workflows/playwright.yml` for CI configuration.

## Writing New Tests

1. Follow the existing pattern of using helper functions
2. Use data-testid attributes for reliable element selection
3. Include proper assertions for both positive and negative cases
4. Test across different viewports when relevant
5. Handle async operations with proper timeouts

## Debugging Tests

- Use `npm run test:e2e:debug` to run tests in debug mode
- Add `await page.pause()` to pause execution at specific points
- Use browser dev tools integration for debugging
- Check screenshots and videos in `test-results/` on failure