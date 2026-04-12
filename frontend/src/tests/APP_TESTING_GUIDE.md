# App-Level Testing Guide

This guide covers the root app test.

## Test File

- `src/tests/App.test.js`

## Run Command

From `frontend` folder:

```bash
npm test -- src/tests/App.test.js --watchAll=false
```

## Purpose

Use this test to validate top-level app rendering and base wiring behavior.
