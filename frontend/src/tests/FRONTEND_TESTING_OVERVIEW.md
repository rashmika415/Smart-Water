# Frontend Testing Overview

This folder contains frontend test suites organized by testing part.

## Testing Parts

- App-level tests: `src/tests/App.test.js`
- Component tests: `src/tests/components`
- Page tests: `src/tests/pages`

## Quick Commands

Run all frontend tests from `frontend` folder:

```bash
npm test -- --watchAll=false
```

Run a specific folder:

```bash
npm test -- src/tests/components --watchAll=false
npm test -- src/tests/pages --watchAll=false
```

## Section Guides

- `src/tests/APP_TESTING_GUIDE.md`
- `src/tests/components/ROUTE_COMPONENT_TESTING_GUIDE.md`
- `src/tests/pages/PAGES_TESTING_GUIDE.md`
- `src/tests/pages/admin/ADMIN_PAGES_TESTING_GUIDE.md`
- `src/tests/pages/user/USER_PAGES_TESTING_GUIDE.md`
