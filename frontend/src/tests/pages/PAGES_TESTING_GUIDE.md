# Pages Testing Guide

This section covers page-level UI tests.

## Sub-Parts

- Shared pages: login, register, contact
- Admin pages
- User pages

## Run Commands

From `frontend` folder:

```bash
npm test -- src/tests/pages --watchAll=false
npm test -- src/tests/pages/LoginPage.test.jsx --watchAll=false
npm test -- src/tests/pages/RegisterPage.test.jsx --watchAll=false
npm test -- src/tests/pages/ContactPage.test.jsx --watchAll=false
```

## Additional Guides

- `src/tests/pages/admin/ADMIN_PAGES_TESTING_GUIDE.md`
- `src/tests/pages/user/USER_PAGES_TESTING_GUIDE.md`
