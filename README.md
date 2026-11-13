# Expense Claim Management System (Full-Stack)

A complete, production-ready Full-Stack Expense Claim Management application built with **Spring Boot 3** on the backend and **React Native** (React Native Web) on the frontend, with **PostgreSQL / MySQL / H2** database support.

---

## 🚀 Key Features & Implementation Matrix

| Requirement | Implementation Details |
|---|---|
| **1. Architecture** | Spring Boot 3 + React Native (Web/Mobile) + PostgreSQL/MySQL/H2. |
| **2. Role-Based Access Control (RBAC)** | `ROLE_EMPLOYEE` and `ROLE_MANAGER` enforced via Spring Security `@PreAuthorize` and React Native route guards. |
| **3. JWT Authentication & BCrypt** | Short-lived Access Token + long-lived Refresh Token. Passwords hashed with BCrypt. |
| **4. Seeding & Registration** | All new signups default to `EMPLOYEE`. One `MANAGER` seeded automatically on startup. |
| **5. Claim Ownership Rule** | Employees can only access their own claims. Accessing another user's claim returns HTTP 403 Forbidden. |
| **6. Claim CRUD & Status Guard** | Create, view, edit, and delete claims. Editing and deleting are restricted strictly to `PENDING` claims. |
| **7. Search, Filter & Pagination** | Server-side pagination, keyword search (title, description), and status filtering (`ALL`, `PENDING`, `APPROVED`, `REJECTED`). |
| **8. Manager Overview** | Managers can view all organizational claims with filters by status, employee, and expense date range (`startDate`, `endDate`). |
| **9. Approval Workflow** | Managers approve or reject claims. Rejection requires a mandatory comment. Approved/rejected claims cannot be altered. |
| **10. Receipt Attachment** | File upload for images (`JPEG`, `PNG`, `WEBP`) and `PDF` with type and size (max 5MB) validation. Viewing and downloading supported. |
| **11. Audit Trail Timeline** | Comprehensive audit log tracking actor, role, action (`CREATED`, `UPDATED`, `DELETED`, `APPROVED`, `REJECTED`, `RECEIPT_ATTACHED`), and timestamp, rendered as an interactive timeline. |
| **12. Dashboards** | **Employee**: Total claimed, approved, rejected, and pending amounts.<br>**Manager**: Counts by status, totals by category, and monthly summary table. |
| **13. User Management** | Managers can view the user directory and toggle account status (`Active` / `Deactivated`). Deactivated users are blocked from logging in. |
| **14. Frontend Guards & Menus** | Role-based navigation bar, Access Denied (403) page, and conditional buttons. |
| **15. Axios Interceptor** | Automatically attaches JWT token, handles 401 errors by silently refreshing the token, and logs out on refresh failure. |
| **16. Validation & UI States** | Bean validation (`@Valid`), client-side form validation, loading spinners, and error alerts. |
| **17. Layered Architecture** | `Controller` → `Service` → `Repository` with request/response DTOs. |
| **18. Global Exception Handler** | Standardized JSON error response with appropriate HTTP status codes (400, 401, 403, 404, 500). |
| **19. Unit Tests** | 10 unit tests covering `AuthService` and `ClaimService` with JUnit 5 & Mockito. |
| **20. Bonus: Swagger, Docker, CSV** | Swagger UI (`/swagger-ui.html`), `docker-compose.yml` (PostgreSQL + App), and CSV export for claims (`/api/claims/export/csv`). |

---

## 🔑 Default Accounts (Seeded at Startup)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Manager** | `manager@company.com` | `Manager@123` | View all claims, approve/reject, user management, CSV export, manager dashboard. |
| **Employee 1** | `john.doe@company.com` | `Employee@123` | Create/edit/delete pending claims, upload receipts, employee dashboard. |
| **Employee 2** | `jane.smith@company.com` | `Employee@123` | Create/edit/delete pending claims, upload receipts, employee dashboard. |

*You can also register any new Employee account directly from the frontend Register screen.*

---

## 📂 Project Directory Structure

```text
task1/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/expense/claim/
│   │   │   │   ├── config/          # SecurityConfig, JwtAuthenticationFilter, OpenApiConfig, DataInitializer
│   │   │   │   ├── controller/      # AuthController, ClaimController, DashboardController, UserController
│   │   │   │   ├── dto/             # Request & Response DTOs
│   │   │   │   ├── entity/          # User, Claim, ClaimAuditLog, Enums (Role, ClaimStatus, ClaimCategory, AuditAction)
│   │   │   │   ├── exception/       # GlobalExceptionHandler, ResourceNotFoundException, BusinessException
│   │   │   │   ├── repository/      # UserRepository, ClaimRepository, ClaimAuditLogRepository
│   │   │   │   ├── service/         # AuthService, ClaimService, DashboardService, UserService, FileStorageService, AuditLogService
│   │   │   │   └── util/            # JwtUtil, CsvExportUtil
│   │   │   └── resources/
│   │   │       └── application.yml  # Multi-profile config (h2, postgres, mysql)
│   │   └── test/java/com/expense/claim/
│   │       ├── AuthServiceTest.java # 4 unit tests
│   │       └── ClaimServiceTest.java# 6 unit tests
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios instance, interceptors, authApi, claimApi, userApi, dashboardApi
│   │   ├── components/              # Navbar, StatusBadge, StatCard, AuditTimeline, ReceiptModal
│   │   ├── context/                 # AuthContext (login, register, token refresh, auto logout)
│   │   ├── navigation/              # AppNavigator (Role-based route guards)
│   │   ├── screens/
│   │   │   ├── auth/                # LoginScreen, RegisterScreen
│   │   │   ├── employee/            # EmployeeDashboardScreen, MyClaimsScreen, CreateEditClaimScreen
│   │   │   ├── manager/             # ManagerDashboardScreen, AllClaimsScreen, UserManagementScreen
│   │   │   └── common/              # ClaimDetailScreen, AccessDeniedScreen
│   │   ├── theme/                   # Colors & styling palette
│   │   ├── App.jsx                  # Main application component
│   │   └── index.js                 # React Native Web entrypoint
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Running the Application

### Option A: Local Development (Instant Out-of-the-Box)

#### 1. Backend (Spring Boot with in-memory H2)
Ensure Java 17+ is installed:
```powershell
cd backend
# Build and run with Maven (or the portable wrapper)
mvn spring-boot:run
```
*Or run the pre-built JAR:*
```powershell
java -jar backend/target/claim-management-1.0.0.jar
```
*Backend runs on:* `http://localhost:8080`  
*Swagger Documentation:* `http://localhost:8080/swagger-ui.html`  
*OpenAPI Specification:* `http://localhost:8080/v3/api-docs`  
*H2 Console (optional):* `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:claimedb`, User: `sa`, Password: *(empty)*)

#### 2. Frontend (React Native Web)
Ensure Node.js 18+ is installed:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:3000` (automatically proxies `/api` calls to port 8080).

---

### Option B: Docker Compose (PostgreSQL + Spring Boot + React Native Web)

To spin up the entire production stack (PostgreSQL database, Spring Boot backend, and Nginx-hosted frontend) with a single command:

```powershell
docker-compose up --build
```

- **Frontend App:** `http://localhost:3000`
- **Backend API & Swagger:** `http://localhost:8080/swagger-ui.html`
- **PostgreSQL Database:** `localhost:5432` (`claim_db` / `postgres` / `postgrespassword`)

---

## 🧪 Running Unit Tests

Run the test suite using Maven:
```powershell
cd backend
mvn test
```
**Results:** `10 Tests run, 0 Failures, 0 Errors, 0 Skipped`
- `AuthServiceTest`:
  - `testRegisterSuccess()`: Validates that new accounts are assigned `ROLE_EMPLOYEE`.
  - `testRegisterDuplicateEmailThrowsBusinessException()`: Prevents duplicate registrations.
  - `testLoginSuccess()`: Validates token issuance on valid credentials.
  - `testLoginDeactivatedUserThrowsUnauthorizedException()`: Verifies deactivated accounts are blocked.
- `ClaimServiceTest`:
  - `testCreateClaimSuccess()`: Confirms claim creation and audit entry.
  - `testUpdateClaimSuccessWhenPending()`: Verifies updating allowed for PENDING status.
  - `testUpdateClaimFailsWhenNotPending()`: Blocks editing approved or rejected claims.
  - `testRejectClaimWithoutCommentThrowsBusinessException()`: Enforces mandatory comment upon rejection.
  - `testApproveClaimSuccess()`: Verifies manager approval workflow.
  - `testEmployeeCannotAccessAnotherEmployeeClaim()`: Enforces ownership rule and returns 403.

---

## 📡 API Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new employee (Default role: `ROLE_EMPLOYEE`).
- `POST /api/auth/login` - Authenticate using email and password; returns JWT access & refresh tokens.
- `POST /api/auth/refresh` - Refresh an expired access token using a refresh token.
- `GET /api/auth/me` - Get profile of authenticated user.

### Claims (`/api/claims`)
- `POST /api/claims` - Create a new claim (*Employee only*).
- `GET /api/claims` - List claims with pagination, status filter, search, and manager date/employee filters.
- `GET /api/claims/{id}` - Get claim details (Ownership check enforced for employees).
- `PUT /api/claims/{id}` - Update claim (*Employee only*, only allowed while `PENDING`).
- `DELETE /api/claims/{id}` - Delete claim (*Employee only*, only allowed while `PENDING`).
- `PATCH /api/claims/{id}/review` - Approve or reject claim (*Manager only*, rejection comment mandatory).
- `POST /api/claims/{id}/approve` - Shortcut to approve claim (*Manager only*).
- `POST /api/claims/{id}/reject` - Shortcut to reject claim (*Manager only*, comment required).
- `POST /api/claims/{id}/receipt` - Attach receipt file (*JPEG, PNG, WEBP, PDF, max 5MB*).
- `GET /api/claims/{id}/receipt` - Download or preview receipt.
- `GET /api/claims/{id}/audit-logs` - Retrieve chronological audit log timeline.
- `GET /api/claims/export/csv` - Export filtered claims data to CSV (*Manager only*).

### Dashboards (`/api/dashboard`)
- `GET /api/dashboard/employee` - Metrics for logged-in employee (claimed, approved, rejected, pending totals).
- `GET /api/dashboard/manager` - Organization metrics (status counts, category totals, monthly summary).

### User Management (`/api/users`)
- `GET /api/users` - List all users with search and pagination (*Manager only*).
- `GET /api/users/{id}` - Get user details (*Manager only*).
- `PATCH /api/users/{id}/status?active=true/false` - Activate or deactivate user (*Manager only*).
