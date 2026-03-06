# Feature Specification: Unit Test Coverage Foundation

**Feature Branch**: `001-unit-tests`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "We are at a point with our site where we need to start adding unit tests. We have no unit test coverage and that is a huge liability if we keep adding onto the site"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catch Regressions Before They Ship (Priority: P1)

A developer makes changes to shared utility logic (date formatting, form validation, API response construction) and the test suite immediately catches any unintended breakage before the code is merged.

**Why this priority**: Shared utilities are used across multiple features. A broken formatter or validator can silently corrupt user-facing output. Catching this at the unit level is the cheapest possible regression net.

**Independent Test**: Run the test suite after modifying `formatters.ts` or `formShared.ts` and verify failures surface clearly, without any AWS credentials or deployed backend.

**Acceptance Scenarios**:

1. **Given** a developer modifies the `formatEventDate` function, **When** they run the test suite, **Then** tests covering date formatting pass or fail based on whether behavior changed
2. **Given** a developer introduces a bug in `parsePayload` (required field validation), **When** tests run, **Then** the test suite reports a clear failure pinpointing the broken behavior
3. **Given** all tests pass on main, **When** a PR is submitted, **Then** CI/CD runs tests automatically and blocks merge on failure

---

### User Story 2 - Validate Lambda Handler Routing and Responses (Priority: P2)

A developer can verify that Lambda handlers route requests correctly, reject unauthorized requests, and return well-formed HTTP responses — without deploying to AWS or needing real credentials.

**Why this priority**: Lambda handler bugs are expensive to catch in production (require deployment + real AWS resources). Unit tests with mocked AWS services provide fast, free feedback on routing and response logic.

**Independent Test**: Run lambda tests locally with no AWS credentials. Mocked DynamoDB/SES responses validate handler return values and error paths end-to-end.

**Acceptance Scenarios**:

1. **Given** a request to a protected admin endpoint without a valid key, **When** the handler runs, **Then** a 401 response is returned
2. **Given** a form submission with a missing required field, **When** the handler processes it, **Then** a 400 response with a descriptive error is returned
3. **Given** a valid form payload, **When** the handler runs, **Then** the correct DynamoDB write is attempted with the expected data shape

---

### User Story 3 - Validate Frontend API Client Behavior (Priority: P3)

A developer can verify that the frontend API client correctly constructs requests, handles error responses, and attaches admin headers — without a running backend.

**Why this priority**: The API client is the sole interface between the frontend and backend. Silent failures (wrong URL construction, missing headers, swallowed errors) are hard to debug in a deployed static site.

**Independent Test**: Mocking the fetch API verifies client behavior entirely in isolation — no backend, no network.

**Acceptance Scenarios**:

1. **Given** a non-200 response from the API, **When** `fetchAPI` processes it, **Then** an error with the server's error message is thrown
2. **Given** an admin API call, **When** the request is constructed, **Then** the `x-admin-key` header is included
3. **Given** a successful API response, **When** `fetchAPI` resolves, **Then** the parsed JSON data is returned to the caller

---

### Edge Cases

- What happens when `formatTime` receives an invalid or empty time string?
- How does `formatEventDate` handle dates at month/year boundaries?
- How does `parsePayload` behave when required fields are present but null vs. missing entirely?
- What happens when `artistApplication` finds multiple DynamoDB records matching the same email?
- How does `requireAdmin` behave when the Secrets Manager call fails?
- What does `fetchAPI` return when the response body is not valid JSON?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The codebase MUST have a runnable test suite in each package (lambda, frontend) invocable with a single command
- **FR-002**: Tests MUST run without AWS credentials, deployed infrastructure, or network access — all external services are mocked
- **FR-003**: CI/CD pipeline MUST automatically run the test suite on every pull request and block merge on test failure
- **FR-004**: All pure utility functions in `frontend/lib/formatters.ts` MUST have tests covering primary logic and documented edge cases
- **FR-005**: All shared response helpers and validation logic in `lambda/src/lib/formShared.ts` MUST have tests (ok, created, errResponse, parseBody, parsePayload, newItem)
- **FR-006**: Lambda handler routing logic MUST have tests verifying the correct handler is dispatched and the expected HTTP status code is returned
- **FR-007**: Admin authentication rejection (missing or invalid key) MUST be tested for all protected endpoints
- **FR-008**: Frontend API client (`frontend/lib/api/client.ts`) MUST have tests covering success paths, error paths, and header construction
- **FR-009**: JSON-LD schema factory functions in `frontend/lib/structuredData.ts` MUST have tests verifying correct schema shape for key event scenarios
- **FR-010**: New code additions to shared utilities and handlers MUST include unit tests as part of the definition of done going forward

### Key Entities

- **Test Suite**: A collection of tests organized by package (lambda, frontend), runnable independently or together
- **Test Coverage**: The set of source behaviors verified by tests — focused on correctness of key logic, not line percentage targets
- **Mock**: A stand-in for an external dependency (DynamoDB, S3, SES, Secrets Manager, fetch) that allows tests to run in isolation from real infrastructure

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The full test suite in each package runs to completion without requiring any manual intervention
- **SC-002**: Zero test setup requires AWS credentials, deployed infrastructure, or network access
- **SC-003**: All pure utility functions (formatters, schema generators, response helpers, payload validators) have tests covering primary logic and documented edge cases
- **SC-004**: CI/CD pipeline reports test results and fails PRs with test failures within 5 minutes of submission
- **SC-005**: A developer unfamiliar with the codebase can run all tests with a single command per package and see passing results on a clean checkout
- **SC-006**: The test suite catches an intentionally introduced regression in each covered module when manually verified

## Assumptions

- React component rendering tests are out of scope for this feature; coverage targets utility functions, API clients, and Lambda handlers
- `generateThumbnail.ts` (browser Canvas API) is excluded from initial scope due to environment mocking complexity
- The existing CI/CD GitHub Actions pipeline will be extended to run tests, not replaced
- Coverage percentage is not a hard target — correctness of key business logic is the goal
- Lambda and frontend will each have independent test configurations and run separately
