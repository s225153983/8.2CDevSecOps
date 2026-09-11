# SIT753 7.1C DevSecOps pipeline

This repository is a clone of the intentionally vulnerable [snyk-labs/nodejs-goof](https://github.com/snyk-labs/nodejs-goof) application. It carries the Jenkins pipeline for Part 1 Task 2 and Part 2 Task 1 of the SIT753 Credit task.

## Pipeline stages

| Stage | What it does | Tool |
| --- | --- | --- |
| Checkout | Pulls the latest commit from the `main` branch of this repository | Git plugin for Jenkins |
| Install Dependencies | Resolves the 32 runtime dependencies so the later stages have something to analyse | npm |
| Run Tests | Runs the unit tests in `tests/unit` | Node.js built in test runner |
| Generate Coverage Report | Produces `coverage/lcov.info` for SonarCloud to read | c8 |
| NPM Audit (Security Scan) | Lists every known CVE in the dependency tree and writes a JSON report | npm audit |
| SonarCloud Analysis | Downloads the SonarScanner CLI, scans the code and uploads the results | SonarScanner CLI 7.3.0.5189 and SonarCloud.io |

Jenkins polls this repository every five minutes with `pollSCM('H/5 * * * *')`, so a new commit starts the job without a webhook.

## Changes made to the upstream project

The upstream project ships `"test": "snyk test"`, which needs a Snyk account and an authentication token before it will run. Three changes make the pipeline work end to end without that account.

1. `tests/unit/utils.test.js` adds six unit tests over the helper functions in `utils.js`. These tests need no database, so they run on any Jenkins agent.
2. `npm test` now runs those tests and the original Snyk check moved to `npm run test:snyk`.
3. `npm run coverage` runs the same tests under c8 and writes `coverage/lcov.info`, which is the file `sonar.javascript.lcov.reportPaths` points at.

## A note on the Sonar token

The task sheet shows `sonar.login=${SONAR_TOKEN}` inside `sonar-project.properties`. A properties file does not expand environment variables, so the scanner would send the literal text `${SONAR_TOKEN}` and the analysis would fail with a 401. This repository leaves the token out of the properties file. The pipeline reads it from the Jenkins credential named `SONAR_TOKEN` inside a `withCredentials` block and passes it to the scanner as `-Dsonar.token`, which keeps the secret out of both the repository and the build log.

## Running the security scan locally

```
npm install
npm test
npm run coverage
npm audit
```
