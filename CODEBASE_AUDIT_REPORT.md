# HaH Real Estates — Full-Stack Codebase Audit Report

**Date:** April 20, 2026 (Round 5 update)  
**Stack:** React 19 + Vite · Spring Boot 3 + MySQL · JWT Auth  
**Auditor role:** Senior Software Architect / Full-Stack Code Reviewer  
**Audit round:** 5 (incremental — builds on rounds 1, 2, 3 & 4)

---

## Executive Summary

HaH Real Estates is a two-role (Customer / Broker) real estate marketplace. This round covers resolution of all previously outstanding REM and INT issues, and the addition of comprehensive test coverage for the Site Visit feature.

**Overall Health: Good — Production-Eligible after REM-01 fix**

Round 5 closed eight open items: backend `@Size` constraint + `DataIntegrityViolationException` handler (REM-02), active visit cancellation on property delete / deal close (REM-03), duplicate route dead code in App.jsx (REM-04), misleading `REQUESTED` input on status-update endpoint (REM-05), fragile pagination unwrapping across four frontend components replaced by a shared `parsePage` utility (INT-10), explicit `@JsonFormat` on `visitDateTime` (INT-13), case-insensitive `@JsonCreator` on `VisitStatus` enum (INT-14), and `minDateTime` timezone mismatch + JVM UTC pin (INT-17). Six new test files were added (SiteVisitServiceTest — 16 cases, SiteVisitControllerTest — 13 cases, plus SiteVisitModal / MyVisits / BrokerVisitRequests frontend tests), and the two missing exception handler cases (`IllegalStateException`, `DataIntegrityViolationException`) were added to `GlobalExceptionHandlerTest`. **The only item that must be closed before a public deployment is the hardcoded JWT secret fallback (REM-01).**

### Strengths (verified in current codebase)

- `GlobalExceptionHandler` now handles `IllegalStateException` → 400 BAD REQUEST (previously missing)
- `getDealForProperty` now guards caller identity — only the deal's customer or managing broker may read it (previously open to all authenticated users)
- `UserService.getCurrentUserProfile` now calls `findByOwner_IdAndIsDeletedFalse`; soft-deleted submissions no longer surface in Dashboard or Profile (previously missing filter)
- Role-based security enforced at both the Spring Security filter layer and the service layer (defense-in-depth)
- `SiteVisitService.updateVisitStatus` verifies broker ownership of the visit before allowing status changes
- Duplicate-visit guard for the same customer + property (`existsByCustomer_IdAndProperty_PropIdAndStatusIn`)
- Valid state-machine transitions enforced: REQUESTED → CONFIRMED/CANCELLED; CONFIRMED → COMPLETED/CANCELLED; terminal states blocked
- All queue-based auth and CORS improvements from prior rounds are intact
- Registration form now collects optional `city` field and password placeholder corrected to “Min 8 characters” (BUG-05, BUG-06 ✅)
- Map view now reloads pins when filters change while already in map mode (BUG-07 ✅)
- `GET /api/users/me/analytics` explicitly role-gated under `hasRole("BROKER")` in SecurityConfig (BUG-08 ✅)
- Deal endpoints (`getCustomerTransactions`, `getBrokerPipeline`) now return `Page<DealResponse>` with pagination params; `MyTransactions` frontend renders pagination controls (BUG-09 ✅)
- ProximityService radius comment corrected to `// 1 km` (BUG-10 ✅)
- `deleteProperty` now guards against active non-CLOSED deals before soft-deleting (BUG-11 ✅)
- `UserProfileUpdateRequest.mobile` constraint relaxed from `@NotBlank` to `@Size(max=20)` (BUG-12 ✅)
- Customer Dashboard now calls `GET /properties/me/recently-viewed` and `GET /properties/recommended` (Feature 17 & 23 ✅)
- `SiteVisitModal` textarea now enforces `maxLength={500}` (frontend half of REM-02 ✅)
- `SiteVisitRequest.notes` now annotated `@Size(max=500)` — API-level enforcement (REM-02 ✅)
- `GlobalExceptionHandler` now handles `DataIntegrityViolationException` → 400 BAD REQUEST (REM-02 ✅)
- `SiteVisitRepository.cancelActiveVisitsForProperty` bulk-cancels REQUESTED/CONFIRMED visits; called in `deleteProperty` and `advanceDealStatus` on CLOSED transition (REM-03 ✅)
- Duplicate `/properties` and `/properties/:id` route definitions removed from the customer-only block in `App.jsx` (REM-04 ✅)
- `@ValidBrokerVisitStatus` constraint + `ValidBrokerVisitStatusValidator` whitelist CONFIRMED/COMPLETED/CANCELLED only; REQUESTED rejected at DTO level with a clear message (REM-05 ✅)
- `parsePage()` utility in `normalizers.js` — a single function handles `Page<T>` and plain array responses; all four fragile `content || data || []` patterns replaced (INT-10 ✅)
- `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")` added to `SiteVisitRequest.visitDateTime` — explicit over implicit deserialization (INT-13 ✅)
- `@JsonCreator fromValue()` on `VisitStatus` enum — case-insensitive deserialization; unknown values return null for clean validation error (INT-14 ✅)
- `SiteVisitModal.minDateTime` rebuilt from local-time components (not UTC ISO slice); JVM pinned to UTC via `TimeZone.setDefault(UTC)` in `BackendApplication.main`; service guard updated to `LocalDateTime.now(ZoneOffset.UTC)` (INT-17 ✅)
- `SiteVisitServiceTest` (16 cases), `SiteVisitControllerTest` (13 cases), `SiteVisitModal.test.jsx` (10 cases), `MyVisits.test.jsx` (11 cases), `BrokerVisitRequests.test.jsx` (13 cases) added; `GlobalExceptionHandlerTest` patched with `IllegalStateException` and `DataIntegrityViolationException` cases; `DealServiceTest` updated with `SiteVisitRepository` mock ✅

### Remaining Issues after This Audit

| # | Severity | Description |
|---|----------|-------------|
| REM-01 | **Critical** | Default JWT secret committed as fallback in `application-dev.yml` |

### Audit Round History

| Round | Date | Net Change | Issues Found | Closed |
|-------|------|-----------|--------------|--------|
| 1 | prior | Baseline | BUG-01→15 | — |
| 2 | prior | Fixes applied | 4 remaining | 11 of 15 |
| 3 | Apr 19, 2026 | Site Visit feature added | 5 new | 3 of 4 prior |
| 4 | Apr 19, 2026 | 8 bugs closed; Feature 17 & 23 completed | 0 new | 8 of remaining |
| **5 (this)** | **Apr 20, 2026** | **REM-02–05 + INT-10,13,14,17 closed; 6 new test files; test gaps addressed** | **0 new** | **8 of remaining** |

---

## Part 1: File-by-File Feature Map

### 1.1 Backend Architecture

```
com.dayforce.backend/
├── BackendApplication.java
├── config/
│   ├── OpenApiConfig.java           Swagger / bearerAuth scheme
│   ├── SchemaInitializer.java       Runtime MySQL schema repairs (idempotent)
│   └── security/
│       ├── SecurityConfig.java      CORS, CSRF-off, role-based route rules, JWT filter
│       ├── JwtService.java          HS256 token generation + validation
│       ├── JwtAuthenticationFilter.java  Per-request token extraction
│       └── ApplicationConfig.java   UserDetailsService, BCrypt, AuthenticationProvider
├── domain/entity/
│   ├── User.java                    Base user; JPA JOINED inheritance, UserDetails
│   ├── Customer.java / Broker.java  Subclasses with role-specific name fields
│   ├── Property.java                Core listing (soft-delete, view counter, geocoords)
│   ├── Deal.java                    Customer-Property transaction with status lifecycle
│   ├── Favorite.java                Customer-Property many-to-many
│   ├── NearbyAmenity.java           Hospital/School/Police per property
│   ├── PropertyImage.java           URL + display order per property
│   ├── PropertyRejection.java       Broker rejection record
│   ├── PropertyView.java            ★ NEW — upsert view-history row per customer+property (unique constraint)
│   └── SiteVisit.java              ★ NEW — visit request with customer, broker, property, visitDateTime, status
├── application/
│   ├── dto/                         Auth / deal / property / user / proximity / sitevisit DTOs
│   ├── mapper/PropertyMapper.java   Entity↔DTO; two toEntity() overloads (Broker, Customer)
│   └── service/
│       ├── AuthService.java          register, login, refresh with token rotation
│       ├── PropertyService.java      CRUD + search + consensus approval engine + image upload
│       │                             + view recording + recommendation engine
│       ├── DealService.java          Create deal, transactions, pipeline, advance status
│       │                             + getDealForProperty with ownership guard
│       ├── FavoriteService.java      Add/remove/list/check favorites (incl. image URLs)
│       ├── UserService.java          Profile, password change, customer/broker metrics+analytics
│       ├── ProximityService.java     Nominatim geocode → Overpass POI fetch
│       ├── ImageStorageService.java  Secure multipart image storage (UUID filenames)
│       └── SiteVisitService.java    ★ NEW — visit request, list, cancel, broker management
├── infrastructure/
│   ├── repository/                  JPA repos; SiteVisitRepository ★ NEW, PropertyViewRepository ★ NEW
│   └── specification/               PropertySpecification, DealSpecification
├── presentation/controller/         AuthController, PropertyController, DealController,
│                                    FavoriteController, UserController, ProximityController,
│                                    SiteVisitController ★ NEW
└── comon/exception/
    ├── AccessDeniedException.java
    ├── ResourceNotFoundException.java
    └── GlobalExceptionHandler.java  Handles ResourceNotFound→404, IllegalArgument→400,
                                     IllegalState→400 ★ NEW, AccessDenied→403, Validation→400
```

### 1.2 Frontend Architecture

```
src/
├── main.jsx                  Root: Provider, ToastProvider, BrowserRouter
├── App.jsx                   Route tree with ProtectedRoute guards
├── store/
│   ├── index.js              Redux store
│   └── features/authSlice.js setCredentials, updateTokens, logout; sessionStorage
├── services/api.js           Axios instance + 401 interceptor + refresh-token queue
├── utils/
│   ├── constants.js          ROLES, ROUTES
│   ├── enums.js              Enum label formatters
│   ├── errorMessages.js      API-error extractor
│   └── normalizers.js        normalizeProperty / normalizeDeal / normalizeUserProfile
├── context/ToastContext.jsx  Toast provider
├── hooks/useToast.js         Toast consumer hook
├── components/
│   ├── common/               ProtectedRouteFile, StatsCard
│   ├── layout/               DashboardLayout, Sidebar, Navigationbar, PublicLayout
│   ├── property/             PropertyCard, PropertyForm, PropertyList, MapView,
│   │                         ProximityAmenities, PropertyPreviewContent, TransactionModal
│   └── ui/                   Badge, Button, Spinner
├── features/
│   ├── auth/                 Login, Register
│   ├── dashboard/            CustomerDashboard, BrokerDashboard, BrokerAnalytics
│   ├── profile/              Profile
│   ├── property/             AddProperty, EditProperty, ManagedProperties, MyProperties,
│   │                         SubmitProperty, PropertyPreview, MySubmissions,
│   │                         OwnerSubmissions, PropertyDetails, SavedListings
│   ├── transactions/         MyTransactions, DealPipeline
│   └── visits/               MyVisits ★ NEW, BrokerVisitRequests ★ NEW
└── pages/public/             Home
```

**New components (round 3):**
- [SiteVisitModal.jsx](frontend/src/components/property/SiteVisitModal.jsx) — customer-facing booking modal embedded in PropertyDetails
- [MyVisits.jsx](frontend/src/features/visits/MyVisits.jsx) — customer visits list with cancel action
- [BrokerVisitRequests.jsx](frontend/src/features/visits/BrokerVisitRequests.jsx) — broker visit management with status-tab filter, confirm/complete/cancel actions

Both new pages are registered in [Sidebar.jsx](frontend/src/components/layout/Sidebar.jsx) nav links (customer: `My Visits`; broker: `Visit Requests`) and in [App.jsx](frontend/src/App.jsx) routes (`/my-visits`, `/broker/visit-requests`).

---

---

## Part 2: Feature Audit

### Feature 1: User Registration

| Field | Detail |
|-------|--------|
| **Description** | Customer or Broker signup with name, email, phone, role, password |
| **User flow** | Home → Register → fill form → `POST /auth/register` → navigate to Login with success message |
| **Frontend files** | [Register.jsx](frontend/src/features/auth/Register.jsx), [authSlice.js](frontend/src/store/features/authSlice.js), [api.js](frontend/src/services/api.js) |
| **Backend files** | [AuthController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/AuthController.java), [AuthService.java](backend/src/main/java/com/dayforce/backend/application/service/AuthService.java), [RegisterRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/auth/RegisterRequest.java) |
| **Endpoints** | `POST /api/auth/register` |
| **Status** | **Fully Functional** |
| **Evidence** | Frontend Yup schema validates `min(8)` on password; backend `@Size(min=8)` on `RegisterRequest.password` (aligned). `phone` → `mobile` mapped via `@JsonProperty("phone")`. BCrypt hashing. Email uniqueness enforced via `userRepository.existsByEmail`. |
| **Missing pieces** | ~~`city` field accepted by backend but not collected in the Register UI~~ \u2705 Fixed - optional city input now present with `MapPin` icon. ~~Placeholder text in password input still reads "Min 6 characters"~~ \u2705 Fixed - placeholder now reads "Min 8 characters". No email verification flow - still missing. |

---

### Feature 2: User Login

| Field | Detail |
|-------|--------|
| **Description** | Email/password authentication returning JWT access + refresh token pair |
| **User flow** | Login page → enter credentials → `POST /auth/login` → tokens to sessionStorage + Redux → role-based dashboard redirect |
| **Frontend files** | [Login.jsx](frontend/src/features/auth/Login.jsx), [authSlice.js](frontend/src/store/features/authSlice.js) |
| **Backend files** | [AuthController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/AuthController.java), [AuthService.java](backend/src/main/java/com/dayforce/backend/application/service/AuthService.java), [JwtService.java](backend/src/main/java/com/dayforce/backend/config/security/JwtService.java) |
| **Endpoints** | `POST /api/auth/login` |
| **Status** | **Fully Functional** |
| **Evidence** | Spring Security `AuthenticationManager` validates credentials. JWT access token 24h expiry; refresh token 7-day expiry with `tokenType=refresh` claim for discriminating token type at renewal. |
| **Missing pieces** | No login rate limiting or account lockout - still missing. No logout/token-revocation endpoint - still missing. |

---

### Feature 3: Token Refresh (Silent Renewal)

| Field | Detail |
|-------|--------|
| **Description** | Silent access-token renewal using refresh-token rotation, with queue for concurrent requests |
| **User flow** | API interceptor detects 401 → `POST /auth/refresh` → new token pair → retry original request; queued requests drain in order |
| **Frontend files** | [api.js](frontend/src/services/api.js), [authSlice.js](frontend/src/store/features/authSlice.js) (`updateTokens` action) |
| **Backend files** | [AuthController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/AuthController.java), [AuthService.java](backend/src/main/java/com/dayforce/backend/application/service/AuthService.java), [JwtService.java](backend/src/main/java/com/dayforce/backend/config/security/JwtService.java) |
| **Endpoints** | `POST /api/auth/refresh` |
| **Status** | **Fully Functional** |
| **Evidence** | Queue-based refresh correctly prevents duplicate refresh calls. `isRefreshTokenValid` validates expiry and `tokenType=refresh` claim. Token rotation on every refresh. |
| **Missing pieces** | No server-side token blocklist - stolen refresh token remains valid until expiry. Still missing. |

---

### Feature 4: Property Creation (Broker)

| Field | Detail |
|-------|--------|
| **Description** | Broker creates a new listing with all details, three mandatory amenity types, optional images |
| **User flow** | Broker Dashboard → Add Property → fill PropertyForm → auto-fetch or manually enter amenities → upload images → `POST /properties` then `POST /properties/:id/images` |
| **Frontend files** | [AddProperty.jsx](frontend/src/features/property/AddProperty.jsx), [PropertyForm.jsx](frontend/src/components/property/PropertyForm.jsx), [ProximityAmenities.jsx](frontend/src/components/property/ProximityAmenities.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [PropertyMapper.java](backend/src/main/java/com/dayforce/backend/application/mapper/PropertyMapper.java), [ImageStorageService.java](backend/src/main/java/com/dayforce/backend/application/service/ImageStorageService.java) |
| **Endpoints** | `POST /api/properties`, `POST /api/properties/:id/images` |
| **Status** | **Fully Functional** |
| **Evidence** | Yup validates all required fields including bedrooms/bathrooms. Backend `@AssertTrue` enforces ≥1 bedroom and ≥1 bathroom for residential types (FLAT, APARTMENT, HOUSE, VILLA). `validateAmenities` enforces all three types (HOSPITAL, SCHOOL, POLICE_STATION). Status defaults to AVAILABLE. |
| **Missing pieces** | No maximum file size enforcement beyond Tomcat's default multipart limit — still missing. No image deletion or reordering — still missing. Local disk storage is not production-ready (should use S3 or similar) — still missing. |

---

### Feature 5: Property Editing (Broker)

| Field | Detail |
|-------|--------|
| **Description** | Broker updates an existing listing's details; amenities fully replaced |
| **User flow** | Managed Properties → Edit → PropertyForm pre-filled → `PUT /properties/:id` |
| **Frontend files** | [EditProperty.jsx](frontend/src/features/property/EditProperty.jsx), [PropertyForm.jsx](frontend/src/components/property/PropertyForm.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [PropertyMapper.java](backend/src/main/java/com/dayforce/backend/application/mapper/PropertyMapper.java) |
| **Endpoints** | `PUT /api/properties/:id` |
| **Status** | **Fully Functional** |
| **Evidence** | Ownership verified by email. All editable fields updated. `attachAmenities` replaces amenities via `clear()` + re-add with cascade. Geocoordinates re-applied on save. |
| **Missing pieces** | No optimistic locking — two concurrent edits could silently overwrite each other. Still missing. |

---

### Feature 6: Property Deletion (Soft Delete)

| Field | Detail |
|-------|--------|
| **Description** | Broker soft-deletes a property (`isDeleted = true`); deleted properties hidden from all public endpoints |
| **User flow** | Managed Properties → Delete icon → confirm dialog → `DELETE /properties/:id` |
| **Frontend files** | [ManagedProperties.jsx](frontend/src/features/property/ManagedProperties.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) |
| **Endpoints** | `DELETE /api/properties/:id` |
| **Status** | **Fully Functional** |
| **Evidence** | `isDeleted = true` persisted. Public listing endpoints filter `isDeleted = false`. `ManagedProperties` shows deleted list in a separate section. Advancing deals on a deleted property is guarded by `advanceDealStatus`. |
| **Missing pieces** | No restore/undelete capability — still missing. ~~No check for active PENDING/UNDER_CONTRACT deals before allowing soft-delete~~ ✅ Fixed — `deleteProperty` now calls `dealRepository.existsByProperty_PropIdAndStatusNot(propId, CLOSED)` and throws `IllegalArgumentException` if active deals exist (BUG-11). |

---

### Feature 7: Property Search & Listing

| Field | Detail |
|-------|--------|
| **Description** | Paginated property browsing with dynamic criteria filters |
| **User flow** | Properties page → optional filters (title, city, price range, type, bedrooms, furnished) → `GET /properties?page=&size=` or `GET /properties/search?{criteria}` |
| **Frontend files** | [PropertyList.jsx](frontend/src/components/property/PropertyList.jsx), [PropertyCard.jsx](frontend/src/components/property/PropertyCard.jsx), [MapView.jsx](frontend/src/components/property/MapView.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [PropertySpecification.java](backend/src/main/java/com/dayforce/backend/infrastructure/specification/PropertySpecification.java), [PropertyCriteria.java](backend/src/main/java/com/dayforce/backend/application/dto/PropertyCriteria.java) |
| **Endpoints** | `GET /api/properties?page=&size=`, `GET /api/properties/search?{criteria}` |
| **Status** | **Fully Functional** |
| **Evidence** | Specification-based dynamic queries build predicates conditionally. Pagination supported. Filter UI exposes title, city, price range, property type, bedrooms, furnished. Map view fetches up to 500 properties for pin rendering. |
| **Missing pieces** | Filter sidebar does not expose `offerType` or `config` (backend supports both) - still missing. No sort control exposed to user (always DESC by `propId`) - still missing. ~~Map view does not reload when filters change while already in map mode~~ \u2705 Fixed - the `fetchAllForMap` `useEffect` now lists `[viewMode, filters]` as dependencies (BUG-07). |

---

### Feature 8: Property Detail View

| Field | Detail |
|-------|--------|
| **Description** | Full detail with image gallery, specs, nearby amenities grouped by type, deal-stage banner, similar listings |
| **User flow** | Click property card → `GET /properties/:id` → gallery + amenities + transaction button + similar listings |
| **Frontend files** | [PropertyDetails.jsx](frontend/src/features/property/PropertyDetails.jsx), [TransactionModal.jsx](frontend/src/components/property/TransactionModal.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) |
| **Endpoints** | `GET /api/properties/:id`, `GET /api/deals/property/:id` |
| **Status** | **Fully Functional** |
| **Evidence** | Prev/next arrow gallery with thumbnail strip. Amenities grouped by type. Active deal banner shown via `GET /deals/property/:id`. Similar listings ranked by scoring algorithm (type, city, locality, price proximity). View count incremented atomically in DB. Customer view history recorded via upsert into `property_views`. `SiteVisitModal` integrated — customer sees "Schedule a Visit" button when property is AVAILABLE. |
| **Missing pieces** | Similar listings `useEffect` still depends on the full `property` object (`[property]` dependency), not just `property?.id` — still triggers a redundant secondary fetch after the post-transaction `fetchProperty()` call. No server-side timezone for visit scheduling — client and server timezone drift could produce edge-case `@Future` failures. Both still missing. |

---

### Feature 9: Customer Property Submission

| Field | Detail |
|-------|--------|
| **Description** | Customer submits a property listing for broker review; status = PENDING, broker = null |
| **User flow** | Submit Property → PropertyForm + amenities → preview page → confirm → `POST /properties/submit` |
| **Frontend files** | [SubmitProperty.jsx](frontend/src/features/property/SubmitProperty.jsx), [PropertyPreview.jsx](frontend/src/features/property/PropertyPreview.jsx), [PropertyPreviewContent.jsx](frontend/src/components/property/PropertyPreviewContent.jsx), [PropertyForm.jsx](frontend/src/components/property/PropertyForm.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [PropertyMapper.java](backend/src/main/java/com/dayforce/backend/application/mapper/PropertyMapper.java) |
| **Endpoints** | `POST /api/properties/submit` |
| **Status** | **Fully Functional** |
| **Evidence** | Customer-specific `toEntity` overload sets `status=PENDING`, `owner=customer`, `broker=null`. `SchemaInitializer` makes `broker_id` nullable. Amenity validation enforced. |
| **Missing pieces** | `SubmitProperty.jsx` still does not pass `showImageUpload` prop to `PropertyForm` — the prop defaults to `false`, so customers cannot upload images with their submission. No resubmit/edit flow for rejected properties. Both still missing. |

---

### Feature 10: Property Approval/Rejection Consensus Engine

| Field | Detail |
|-------|--------|
| **Description** | Brokers approve or reject customer submissions. First approval assigns the broker. All brokers must reject before REJECTED status is set. |
| **User flow** | Broker → Owner Submissions → Approve / Reject (with modal reason) → `PUT /properties/:id/status` |
| **Frontend files** | [OwnerSubmissions.jsx](frontend/src/features/property/OwnerSubmissions.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) |
| **Endpoints** | `PUT /api/properties/:id/status` |
| **Status** | **Fully Functional** |
| **Evidence** | Approval: `status → AVAILABLE`, broker assigned. Rejection: recorded, duplicate-rejection prevented, consensus against `brokerRepository.count()`. Rejection modal enforces non-empty reason. `GlobalExceptionHandler` now handles `IllegalStateException` → 400. |
| **Missing pieces** | Adding new brokers retroactively changes the consensus threshold for existing pending submissions — still missing. |

---

### Feature 11: Deal Creation (Buy/Rent)

| Field | Detail |
|-------|--------|
| **Description** | Customer initiates a purchase or rental on an AVAILABLE property |
| **User flow** | Property Detail → Buy/Rent button → TransactionModal → confirm (+ rental dates if applicable) → `POST /deals/:propertyId` |
| **Frontend files** | [PropertyDetails.jsx](frontend/src/features/property/PropertyDetails.jsx), [TransactionModal.jsx](frontend/src/components/property/TransactionModal.jsx) |
| **Backend files** | [DealController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java), [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java) |
| **Endpoints** | `POST /api/deals/:propertyId` |
| **Status** | **Fully Functional** |
| **Evidence** | Rental validation (start/end dates required, end > start). Self-purchase prevention via `owner.getId()` check. Property marked RESERVED atomically with deal creation. `@RequestBody(required = false)` allows null body for sales. |
| **Missing pieces** | No maximum price sanity check — still missing. No payment integration — still missing. No ability to cancel a pending deal from the customer side — still missing. |

---

### Feature 12: Deal Pipeline (Broker)

| Field | Detail |
|-------|--------|
| **Description** | Kanban board showing all broker deals in three columns: New Offers / Under Contract / Closed |
| **User flow** | Broker → Deal Pipeline → view columns → Advance button → `PATCH /deals/:id/advance` |
| **Frontend files** | [DealPipeline.jsx](frontend/src/features/transactions/DealPipeline.jsx) |
| **Backend files** | [DealController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java), [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java) |
| **Endpoints** | `GET /api/deals/me/pipeline`, `PATCH /api/deals/:id/advance` |
| **Status** | **Fully Functional** |
| **Evidence** | Status enforced: PENDING → UNDER_CONTRACT → CLOSED. On close: property set to SOLD or RENTED based on `offerType`. Broker ownership verified. Optimistic UI update moves card immediately. |
| **Missing pieces** | No deal cancellation/void — still missing. No undo for an incorrect advance — still missing. |

---

### Feature 13: Customer Transactions

| Field | Detail |
|-------|--------|
| **Description** | Customer views deal history with filter by status and sort by date/cost |
| **User flow** | My Transactions → filter/sort controls → `GET /deals/me/transactions?status=&sortBy=&direction=` |
| **Frontend files** | [MyTransactions.jsx](frontend/src/features/transactions/MyTransactions.jsx) |
| **Backend files** | [DealController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java), [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java), [DealSpecification.java](backend/src/main/java/com/dayforce/backend/infrastructure/specification/DealSpecification.java) |
| **Endpoints** | `GET /api/deals/me/transactions?status=&sortBy=&direction=` |
| **Status** | **Fully Functional** |
| **Evidence** | Sort field allowlist protects against injection (`ALLOWED_SORT_FIELDS = Set.of("dealDate", "dealCost")`). Specification-based filtering. Frontend renders table with status badges, rental period display, and link to property. `normalizeDeal` handles all field aliasing. |
| **Missing pieces** | ~~No pagination — all deals returned as a single list~~ \u2705 Fixed - `getCustomerTransactions` now returns `Page<DealResponse>` with `page`/`size` params; `MyTransactions.jsx` renders prev/next pagination controls and tracks `totalPages` (BUG-09). |

---

### Feature 14: Favorites / Saved Listings

| Field | Detail |
|-------|--------|
| **Description** | Customer save/unsave properties via heart toggle; view all saved listings |
| **User flow** | Property card heart → `POST /favorites/:id` / `DELETE /favorites/:id`. Saved Listings page → `GET /favorites` |
| **Frontend files** | [PropertyCard.jsx](frontend/src/components/property/PropertyCard.jsx), [SavedListings.jsx](frontend/src/features/property/SavedListings.jsx), [PropertyList.jsx](frontend/src/components/property/PropertyList.jsx) |
| **Backend files** | [FavoriteController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/FavoriteController.java), [FavoriteService.java](backend/src/main/java/com/dayforce/backend/application/service/FavoriteService.java) |
| **Endpoints** | `POST /api/favorites/:id`, `DELETE /api/favorites/:id`, `GET /api/favorites`, `GET /api/favorites/:id/check` |
| **Status** | **Fully Functional** |
| **Evidence** | Idempotent add (early-return on duplicate). `FavoriteResponse` now includes `imageUrls` fetched from `PropertyImageRepository`. Heart state seeded from `GET /favorites` on list load. Unsave callback removes card from SavedListings. |
| **Missing pieces** | None significant. |

---

### Feature 15: Proximity Amenities (Auto-Fetch)

| Field | Detail |
|-------|--------|
| **Description** | Auto-fetch nearest hospital, school, police station via Nominatim geocoding + Overpass POI query |
| **User flow** | PropertyForm → fill address fields → Auto-fetch → `GET /proximity/amenities?{address}` → results populate form; falls back to manual entry per type |
| **Frontend files** | [ProximityAmenities.jsx](frontend/src/components/property/ProximityAmenities.jsx) |
| **Backend files** | [ProximityController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/ProximityController.java), [ProximityService.java](backend/src/main/java/com/dayforce/backend/application/service/ProximityService.java) |
| **Endpoints** | `GET /api/proximity/amenities?streetName=&areaName=&landmark=&locality=&city=` |
| **Status** | **Fully Functional** |
| **Evidence** | Standard JDK HttpClient used (no trust-all SSL). Geocode cascades through multiple address candidates. Overpass queries three fallback endpoints. Radius doubles on retry. |
| **Missing pieces** | ~~Comment in `ProximityService` incorrectly documents `SEARCH_RADIUS_METERS = 1_000` as "10 km"~~ \u2705 Fixed - comment now reads `// 1 km` (BUG-10). No rate limiting for external API calls - still missing. |

---

### Feature 16: User Profile Management

| Field | Detail |
|-------|--------|
| **Description** | View/edit profile (name, phone, city) and change password |
| **User flow** | Profile page → edit fields → `PUT /users/me`. Change password form → `PUT /users/me/password` |
| **Frontend files** | [Profile.jsx](frontend/src/features/profile/Profile.jsx) |
| **Backend files** | [UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java), [UserService.java](backend/src/main/java/com/dayforce/backend/application/service/UserService.java), [UserProfileUpdateRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/user/UserProfileUpdateRequest.java), [PasswordChangeRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/user/PasswordChangeRequest.java) |
| **Endpoints** | `GET /api/users/me`, `PUT /api/users/me`, `PUT /users/me/password` |
| **Status** | **Fully Functional** |
| **Evidence** | `@JsonProperty("phone")` on `UserProfileUpdateRequest.mobile` aligns with frontend field name. Frontend fetches fresh profile on mount and syncs to Redux. Password change validates current password, match check, and `@Size(min=8)`. Only one `setCredentials` dispatch per operation. |
| **Missing pieces** | Email cannot be changed (intentional). No avatar upload - still missing. ~~`mobile` field is `@NotBlank` - users who registered without a phone cannot update any profile field~~ \u2705 Fixed - constraint changed to `@Size(max = 20)`, making `mobile` optional on update (BUG-12). |

---

### Feature 17: Customer Dashboard

| Field | Detail |
|-------|--------|
| **Description** | Overview cards (submitted properties count, active rentals, saved listings) + recent properties list |
| **User flow** | Login as customer → `Promise.allSettled([GET /users/me, GET /users/me/metrics])` |
| **Frontend files** | [CustomerDashboard.jsx](frontend/src/features/dashboard/CustomerDashboard.jsx), [StatsCard.jsx](frontend/src/components/common/StatsCard.jsx) |
| **Backend files** | [UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java), [UserService.java](backend/src/main/java/com/dayforce/backend/application/service/UserService.java) |
| **Endpoints** | `GET /api/users/me`, `GET /api/users/me/metrics` |
| **Status** | **Partially Functional** |
| **Evidence** | `Promise.allSettled` gracefully handles partial failures. Stats derived from profile properties + metrics response. |
| **Missing pieces** | ~~No recommendation section visible to customer - `getRecommendedProperties` endpoint exists in the backend but is not called by the Customer Dashboard frontend~~ \u2705 Fixed - `CustomerDashboard` now calls both `GET /properties/me/recently-viewed` and `GET /properties/recommended` via `Promise.allSettled` and renders a \u201cRecommended for You\u201d section when results are present. |

---

### Feature 18: Broker Dashboard

| Field | Detail |
|-------|--------|
| **Description** | Overview cards (active listings, deals closed, pending submissions, revenue) + recent listings table |
| **User flow** | Login as broker → `Promise.allSettled` across 4 endpoints |
| **Frontend files** | [BrokerDashboard.jsx](frontend/src/features/dashboard/BrokerDashboard.jsx), [StatsCard.jsx](frontend/src/components/common/StatsCard.jsx) |
| **Backend files** | Multiple endpoints |
| **Endpoints** | `GET /api/properties/me/managed`, `GET /api/deals/me/pipeline`, `GET /api/properties/pending`, `GET /api/users/me/broker-metrics` |
| **Status** | **Fully Functional** |
| **Evidence** | Total Revenue card correctly sourced from `BrokerMetricsResponse.totalRevenueAmount`. Four parallel calls with `Promise.allSettled`. Recent listings table with status badges and Add Listing CTA. |
| **Missing pieces** | Revenue and deal stats are computed by loading the full deal list in both `getBrokerMetrics` and `getBrokerAnalytics` - duplication still present. |

---

### Feature 19: Broker Portfolio Analytics

| Field | Detail |
|-------|--------|
| **Description** | KPI cards (total views, revenue, active listings) + bar chart (views per property), pie (property type mix), horizontal bar (deal funnel) |
| **User flow** | Broker → Analytics → `GET /users/me/analytics` → Recharts visualizations |
| **Frontend files** | [BrokerAnalytics.jsx](frontend/src/features/dashboard/BrokerAnalytics.jsx) |
| **Backend files** | [UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java), [UserService.java](backend/src/main/java/com/dayforce/backend/application/service/UserService.java), [BrokerAnalyticsResponse.java](backend/src/main/java/com/dayforce/backend/application/dto/user/BrokerAnalyticsResponse.java) |
| **Endpoints** | `GET /api/users/me/analytics` |
| **Status** | **Fully Functional** |
| **Evidence** | Top-10 properties by view count via `findByBroker_IdAndIsDeletedFalseOrderByViewCountDesc`. Property type breakdown via native JPQL aggregation. Deal funnel via `countByProperty_Broker_IdAndStatus`. All charts handle empty states gracefully. |
| **Missing pieces** | ~~`GET /api/users/me/analytics` is not listed in SecurityConfig under `hasRole("BROKER")`~~ \u2705 Fixed - `.requestMatchers(HttpMethod.GET, "/api/users/me/analytics").hasRole("BROKER")` now present in `SecurityConfig` (BUG-08). |

---

### Feature 20: Image Upload & Gallery

| Field | Detail |
|-------|--------|
| **Description** | Broker uploads property images (UUID filenames); gallery displayed on detail page |
| **User flow** | Add/Edit Property → file picker → upload after property creation. Detail page shows gallery with thumbnails and prev/next navigation. |
| **Frontend files** | [PropertyForm.jsx](frontend/src/components/property/PropertyForm.jsx) (upload zone), [PropertyDetails.jsx](frontend/src/features/property/PropertyDetails.jsx) (gallery), [AddProperty.jsx](frontend/src/features/property/AddProperty.jsx), [EditProperty.jsx](frontend/src/features/property/EditProperty.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [ImageStorageService.java](backend/src/main/java/com/dayforce/backend/application/service/ImageStorageService.java), [PropertyImageRepository.java](backend/src/main/java/com/dayforce/backend/infrastructure/repository/PropertyImageRepository.java) |
| **Endpoints** | `POST /api/properties/:id/images`, `GET /api/properties/:id/images` |
| **Status** | **Fully Functional** |
| **Evidence** | UUID filenames, MIME + extension allowlist, path-traversal prevention. 10-file limit on frontend. Display-order tracking. Broker ownership verified before upload. |
| **Missing pieces** | No image deletion or reordering - still missing. Local disk storage via `spring.web.resources.static-locations: file:uploads/` is inadequate for production - still missing. `ImageStorageService` trusts client-reported MIME type - magic-byte verification would be stronger, still missing. |

---

### Feature 21: My Submissions (Customer)

| Field | Detail |
|-------|--------|
| **Description** | Customer tracks submitted properties with status badges and rejection history |
| **User flow** | My Submissions → `GET /properties/me/submissions` → status counts + rejection details |
| **Frontend files** | [MySubmissions.jsx](frontend/src/features/property/MySubmissions.jsx) |
| **Backend files** | [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) |
| **Endpoints** | `GET /api/properties/me/submissions` |
| **Status** | **Fully Functional** |
| **Evidence** | Uses `findByOwner_IdAndIsDeletedFalse` — soft-deleted submissions correctly excluded. Summary counts computed client-side. Rejection history shown when status = REJECTED. |
| **Missing pieces** | No ability to resubmit or edit a rejected property - still missing. |

---

### Feature 22: Site Visit Scheduling ★ NEW

| Field | Detail |
|-------|--------|
| **Description** | Customer requests a site visit for an AVAILABLE property; broker confirms, completes, or cancels. Full state machine: REQUESTED → CONFIRMED → COMPLETED (terminal) / CANCELLED (terminal) |
| **User flow** | **Customer:** Property Details → "Schedule a Visit" button (visible only to authenticated customers, AVAILABLE properties, non-own properties) → `SiteVisitModal` → pick date/time + optional notes → `POST /site-visits/{propertyId}` → toast → "My Visits" page to track. **Broker:** "Visit Requests" sidebar → `BrokerVisitRequests` → filter by status tab → Confirm / Mark Complete / Cancel buttons → `PATCH /site-visits/{visitId}/status` |
| **Frontend files** | [SiteVisitModal.jsx](frontend/src/components/property/SiteVisitModal.jsx), [MyVisits.jsx](frontend/src/features/visits/MyVisits.jsx), [BrokerVisitRequests.jsx](frontend/src/features/visits/BrokerVisitRequests.jsx), [PropertyDetails.jsx](frontend/src/features/property/PropertyDetails.jsx), [Sidebar.jsx](frontend/src/components/layout/Sidebar.jsx), [App.jsx](frontend/src/App.jsx), [constants.js](frontend/src/utils/constants.js) |
| **Backend files** | [SiteVisitController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/SiteVisitController.java), [SiteVisitService.java](backend/src/main/java/com/dayforce/backend/application/service/SiteVisitService.java), [SiteVisit.java](backend/src/main/java/com/dayforce/backend/domain/entity/SiteVisit.java), [SiteVisitRepository.java](backend/src/main/java/com/dayforce/backend/infrastructure/repository/SiteVisitRepository.java), [SiteVisitRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/SiteVisitRequest.java), [SiteVisitResponse.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/SiteVisitResponse.java), [VisitStatusUpdateRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/VisitStatusUpdateRequest.java), [VisitStatus.java](backend/src/main/java/com/dayforce/backend/domain/entity/enums/VisitStatus.java), [SecurityConfig.java](backend/src/main/java/com/dayforce/backend/config/security/SecurityConfig.java) |
| **Endpoints** | `POST /api/site-visits/{propertyId}` (CUSTOMER), `GET /api/site-visits/me` (CUSTOMER), `DELETE /api/site-visits/{visitId}` (CUSTOMER), `GET /api/site-visits/broker/requests` (BROKER), `PATCH /api/site-visits/{visitId}/status` (BROKER) |
| **Status** | **Fully Functional** |
| **Evidence** | SecurityConfig role-gates all 5 endpoints correctly. `requestVisit` validates: property AVAILABLE + not deleted + broker assigned + future date + no duplicate active visit (via `existsByCustomer_IdAndProperty_PropIdAndStatusIn`). `cancelVisit` ownership-checked via `visit.getCustomer().getEmail()`. `updateVisitStatus` ownership-checked via `visit.getBroker().getEmail()`. State-machine transitions are explicit and guarded — setting to REQUESTED from any state is rejected. `SiteVisitModal` sends `visitDateTime + ':00'` for Jackson `LocalDateTime` deserialization. `BrokerVisitRequests` sends `{ status }` as a string that Spring deserializes from the `VisitStatus` enum. All response fields (`propertyId`, `propertyTitle`, `propertyCity`, `brokerName`, `customerName`, `visitDateTime`, `status`, `notes`, `createdAt`) consumed correctly by both frontend pages. |
| **Missing pieces** | ~~(1) Textarea has no `maxLength`~~ ✅ Fixed. ~~`SiteVisitRequest.notes` still has no `@Size(max=500)` backend validation constraint~~ ✅ Fixed — `@Size(max=500)` added; `DataIntegrityViolationException` handler added to `GlobalExceptionHandler` (REM-02). ~~(2) Active visits are not cancelled when the associated property is deleted or a deal closes~~ ✅ Fixed — `cancelActiveVisitsForProperty` bulk-cancel query added to `SiteVisitRepository`; called in `deleteProperty` and `advanceDealStatus` (REM-03). ~~(3) `VisitStatusUpdateRequest` accepts `REQUESTED` as a valid enum value~~ ✅ Fixed — `@ValidBrokerVisitStatus` constraint rejects REQUESTED at DTO level (REM-05). (4) No `updatedAt` timestamp on `SiteVisit` entity — still missing. (5) No pagination on broker visit requests — all visits returned in one list — still missing. |

---

### Feature 23: Property View History / Recently Viewed ★ NEW (Backend Only)

| Field | Detail |
|-------|--------|
| **Description** | Per-customer upsert view-history tracking. Each property detail fetch records or updates a `property_views` row. Endpoint returns the last 10 viewed properties ordered by most-recent first. |
| **User flow** | Customer views any property detail → view recorded server-side. (No frontend page yet.) |
| **Frontend files** | None — endpoint not called from the frontend |
| **Backend files** | [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) (`recordPropertyView`, `getRecentlyViewed`), [PropertyView.java](backend/src/main/java/com/dayforce/backend/domain/entity/PropertyView.java), [PropertyViewRepository.java](backend/src/main/java/com/dayforce/backend/infrastructure/repository/PropertyViewRepository.java), [PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java) |
| **Endpoints** | `GET /api/properties/me/recently-viewed` (CUSTOMER) |
| **Status** | **Fully Functional** |
| **Evidence** | `PropertyView` entity has `@UniqueConstraint(columnNames = {"customer_id", "property_id"})` ensuring one row per pair. Upsert pattern (ifPresentOrElse) updates `viewedAt` on revisit. Endpoint secured under `hasRole("CUSTOMER")` in SecurityConfig. `recordPropertyView` is fire-and-forget (exception swallowed) so it does not block the main response. |
| **Missing pieces** | ~~No frontend consumer or dashboard widget~~ ✅ Fixed — `CustomerDashboard` now calls `GET /properties/me/recently-viewed` and renders a “Recently Viewed” section alongside the new “Recommended for You” section. View recording also fires for broker access of the same `getPropertyDetails` method — for non-customer callers the code early-returns at `if (!(user instanceof Customer))` so brokers are not recorded but they do increment `viewCount`. This behaviour is unchanged and considered acceptable. |

---

## Part 3: Bugs, Risks & Implementation Gaps

### BUG-01: `IllegalStateException` Not Handled → Returns 500 ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~High~~ **Resolved** |
| **Location** | [GlobalExceptionHandler.java](backend/src/main/java/com/dayforce/backend/comon/exception/GlobalExceptionHandler.java) |
| **Resolution** | `@ExceptionHandler(IllegalStateException.class)` added, returning `400 BAD_REQUEST` with the exception message. Both `"You can only change the status of PENDING properties."` and `"You have already rejected this property."` now return structured 400 responses. Frontend error toast receives the meaningful message. |

---

### BUG-02: `GET /api/deals/property/{propertyId}` Leaks Deal Data Cross-Role ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Medium~~ **Resolved** |
| **Location** | [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java) — `getDealForProperty` |
| **Resolution** | Service now checks `callerEmail.equals(customerEmail) || callerEmail.equals(brokerEmail)`, throwing `AccessDeniedException` (→ 403) for all other callers. Only the deal's customer and the property's managing broker can read the deal. |

---

### BUG-03: `UserService.getCurrentUserProfile` Returns Soft-Deleted Submissions ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Medium~~ **Resolved** |
| **Location** | [UserService.java](backend/src/main/java/com/dayforce/backend/application/service/UserService.java) |
| **Resolution** | Changed to `propertyRepository.findByOwner_IdAndIsDeletedFalse(customer.getId())` for both the Customer and Broker branches. Soft-deleted submissions no longer appear in profile responses or dashboard counts. |

---

### BUG-04: Hardcoded Default JWT Secret in Committed Config

| Field | Value |
|-------|-------|
| **Severity** | **High (Security)** |
| **Location** | [application-dev.yml](backend/src/main/resources/application-dev.yml) — `app.jwt.secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}` |
| **Evidence** | The default fallback `404E635266...` is a fixed 64-char hex secret committed to source control. Any environment where `JWT_SECRET` is not explicitly set uses this known value. |
| **Impact** | An attacker who obtains the secret can forge arbitrary JWT tokens, bypassing all authentication. |
| **Fix** | Remove the default value entirely: `${JWT_SECRET}` with no fallback. Add startup validation (`@Value` + `@PostConstruct` sanity check). Rotate the secret if it has been used in a non-local environment. |

---

### REM-02: Backend `@Size` Constraint + `DataIntegrityViolationException` Handler ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Medium~~ **Resolved** |
| **Location** | [SiteVisitRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/SiteVisitRequest.java), [GlobalExceptionHandler.java](backend/src/main/java/com/dayforce/backend/comon/exception/GlobalExceptionHandler.java) |
| **Resolution** | `@Size(max = 500, message = "Notes must not exceed 500 characters.")` added to `SiteVisitRequest.notes`. `GlobalExceptionHandler` now handles `DataIntegrityViolationException` → 400 BAD REQUEST with a generic constraint-violation message. API clients sending oversized notes now receive a clean 400 at the validation layer before any DB write is attempted. |

---

### REM-03: Active Site Visits Cancelled on Property Delete and Deal Close ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Medium~~ **Resolved** |
| **Location** | [SiteVisitRepository.java](backend/src/main/java/com/dayforce/backend/infrastructure/repository/SiteVisitRepository.java), [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java), [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java) |
| **Resolution** | `cancelActiveVisitsForProperty(@Param("propId") Long propId)` added to `SiteVisitRepository` as a `@Modifying @Query` that bulk-sets status = CANCELLED for all REQUESTED and CONFIRMED visits on the given property. `SiteVisitRepository` injected into both `PropertyService` and `DealService`. `deleteProperty` now calls `cancelActiveVisitsForProperty` before setting `isDeleted = true`. `advanceDealStatus` calls it immediately after setting the property to SOLD/RENTED when the deal transitions to CLOSED. |

---

### REM-04: Duplicate Route Definitions in `App.jsx` ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [App.jsx](frontend/src/App.jsx) |
| **Resolution** | The duplicate `/properties` and `/properties/:id` `<Route>` definitions were removed from the customer-only `ProtectedRoute` block. Both paths are already covered by the shared `[CUSTOMER, BROKER]` block and React Router now has a single authoritative definition for each. |

---

### REM-05: `VisitStatusUpdateRequest` Input Whitelist ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [VisitStatusUpdateRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/VisitStatusUpdateRequest.java), [ValidBrokerVisitStatus.java](backend/src/main/java/com/dayforce/backend/comon/validation/ValidBrokerVisitStatus.java), [ValidBrokerVisitStatusValidator.java](backend/src/main/java/com/dayforce/backend/comon/validation/ValidBrokerVisitStatusValidator.java) |
| **Resolution** | `@ValidBrokerVisitStatus` custom constraint annotation and `ValidBrokerVisitStatusValidator` created in `comon/validation/`. The validator uses an `EnumSet.of(CONFIRMED, COMPLETED, CANCELLED)` allowlist. `VisitStatusUpdateRequest.status` is now annotated with both `@NotNull` and `@ValidBrokerVisitStatus`. Sending `{ "status": "REQUESTED" }` is now rejected at DTO validation before the service is invoked, returning 400 with message `"Status must be one of: CONFIRMED, COMPLETED, CANCELLED."` |

---

### BUG-05: Register.jsx Password Placeholder Contradicts Validation ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [Register.jsx](frontend/src/features/auth/Register.jsx) |
| **Resolution** | Password input placeholder now reads `"Min 8 characters"`, matching the Yup `min(8)` validation and the backend `@Size(min=8)` constraint. |

---

### BUG-06: Registration Form Does Not Collect `city` ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [Register.jsx](frontend/src/features/auth/Register.jsx) |
| **Resolution** | An optional `city` input with a `MapPin` icon is now present in the registration form. The Yup schema marks it `optional()`. The registered payload object includes `city`, so new users can set their city during sign-up. |

---

### BUG-07: Map View Does Not Reload When Filters Change While Active ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [PropertyList.jsx](frontend/src/components/property/PropertyList.jsx) |
| **Resolution** | The `fetchAllForMap` `useEffect` dependency array now reads `[viewMode, filters]`. When filters change while the user is already in map view, `fetchAllForMap` re-runs and the pins refresh to match the active filter set. |

---

### BUG-08: `GET /api/users/me/analytics` Not Explicitly Role-Restricted ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [SecurityConfig.java](backend/src/main/java/com/dayforce/backend/config/security/SecurityConfig.java) |
| **Resolution** | `.requestMatchers(HttpMethod.GET, "/api/users/me/analytics").hasRole("BROKER")` is now explicitly listed in the broker-only block of `SecurityConfig`, restoring defense-in-depth. |

---

### BUG-09: Deal List Endpoints Return Unbounded Lists ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low (now), Medium (at scale)~~ **Resolved** |
| **Location** | [DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java) |
| **Resolution** | `getCustomerTransactions` and `getBrokerPipeline` both now accept `page`, `size`, `sortBy`, and `direction` parameters and return `Page<DealResponse>` using `PageRequest`. `MyTransactions.jsx` passes `page`/`size` and renders prev/next pagination controls with a `totalPages` tracker. `DealPipeline.jsx` passes `size=100` to load all deals for the Kanban board view — a reasonable trade-off for a board that requires all cards visible at once. |

---

### BUG-10: `ProximityService` Comment Misdocuments Search Radius ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [ProximityService.java](backend/src/main/java/com/dayforce/backend/application/service/ProximityService.java) |
| **Resolution** | Comment corrected to `// 1 km`. The constant value `1_000` (metres) is unchanged; the documentation now accurately describes it. |

---

### BUG-11: Soft-Deleting a Property With Active Deals Is Allowed ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Medium~~ **Resolved** |
| **Location** | [PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java) — `deleteProperty` |
| **Resolution** | `deleteProperty` now calls `dealRepository.existsByProperty_PropIdAndStatusNot(propId, DealStatus.CLOSED)` before performing the soft-delete. If any non-CLOSED deal exists for the property, `IllegalArgumentException("Cannot delete this property: it has one or more active deals.")` is thrown, which `GlobalExceptionHandler` maps to 400 BAD REQUEST. |

---

### BUG-12: `UserProfileUpdateRequest.mobile` Is `@NotBlank` — Blocks Profile Edits for Phone-Free Users ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Severity** | ~~Low~~ **Resolved** |
| **Location** | [UserProfileUpdateRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/user/UserProfileUpdateRequest.java) |
| **Resolution** | `@NotBlank` replaced with `@Size(max = 20, message = "Mobile number cannot exceed 20 characters")`. The `mobile` field is now optional on profile update — users who registered without a phone can update their name and city without supplying a mobile number. |

---

## Part 4: Frontend–Backend Integration Analysis

### INT-01: Auth — Register

| Field | Value |
|-------|-------|
| **Frontend** | `Register.jsx` sends `{ name, email, password, role, phone, city }` |
| **Backend** | `RegisterRequest` maps `phone` → `mobile` via `@JsonProperty("phone")` |
| **Status** | ✅ Compatible |
| **Issue** | ~~`city` field omitted from frontend payload~~ ✅ Fixed — optional `city` input added to the registration form; payload now includes `city` (BUG-06). |

---

### INT-02: Auth — Login Response Mapping

| Field | Value |
|-------|-------|
| **Frontend** | `Login.jsx` reads `{ token, refreshToken, userId, role, name }` |
| **Backend** | `AuthResponse` exposes `token`, `refreshToken`, `userId`, `email`, `role`, `name` |
| **Status** | ✅ Compatible |
| **Issue** | None |

---

### INT-03: Property Response — Field Aliasing via Normalizer

| Field | Value |
|-------|-------|
| **Frontend** | `normalizeProperty` maps `propId → id`, `offerCost → price`, `areaSqft → area`, `offerType → listingType+offerType` |
| **Backend** | `PropertyResponse` returns `propId`, `offerCost`, `areaSqft`, `offerType` |
| **Status** | ✅ Compatible (normalizer covers all aliases) |
| **Issue** | Normalizer is the single point of fragility — a backend rename without updating the normalizer silently breaks rendering |
| **Fix** | Add integration tests verifying end-to-end field mapping |

---

### INT-04: Deal Creation — Rental Date Format

| Field | Value |
|-------|-------|
| **Frontend** | `TransactionModal.jsx` sends `startDate/endDate` as `"YYYY-MM-DD"` strings from `<input type="date">` |
| **Backend** | `DealRequest` declares `LocalDate`; Jackson ISO-8601 deserialization handles the format |
| **Status** | ✅ Compatible |
| **Issue** | None |

---

### INT-05: Deal Response — Field Names (Normalizer Aliases)

| Field | Value |
|-------|-------|
| **Frontend** | `normalizeDeal` maps `dealId → id`, `dealCost → amount`, `dealDate → transactionDate` |
| **Backend** | `DealResponse` fields are `dealId`, `dealCost`, `dealDate` (no `@JsonProperty` aliases) |
| **Status** | ✅ Compatible |
| **Issue** | None |

---

### INT-06: Property Status Update — `IllegalStateException` Returns 500

| Field | Value |
|-------|-------|
| **Frontend** | `OwnerSubmissions.jsx` calls `api.put('/properties/${propertyId}/status', ...)` and shows toast on error |
| **Backend** | `PropertyService.updatePropertyStatus` throws `IllegalStateException` for constraint violations |
| **Status** | ❌ Broken (HTTP status mismatch) |
| **Issue** | `GlobalExceptionHandler` does not handle `IllegalStateException` → Spring returns 500 with an unstructured body. Frontend `getApiErrorMessage` cannot extract the business message. |
| **Fix** | See BUG-01 |

---

### INT-07: Profile Update — Phone Field Mapping

| Field | Value |
|-------|-------|
| **Frontend** | `Profile.jsx` sends `{ name, phone, city }` |
| **Backend** | `UserProfileUpdateRequest` has `@JsonProperty("phone") private String mobile` |
| **Status** | ✅ Compatible |
| **Issue** | `normalizeUserProfile` correctly maps `profile.mobile → phone` for Redux state |

---

### INT-08: Deal-for-Property — 204 vs 200 Handling

| Field | Value |
|-------|-------|
| **Frontend** | `PropertyDetails.jsx` checks `dealRes.status === 200` before consuming `dealRes.data` |
| **Backend** | Returns `204 No Content` when no deal exists, `200 OK` with body when one does |
| **Status** | ✅ Compatible |
| **Issue** | 204 check correctly prevents `normalizeDeal(null)` execution |

---

### INT-09: Image URLs — Hardcoded localhost Base URL

| Field | Value |
|-------|-------|
| **Frontend** | `<img src={imageUrl}>` uses URL directly |
| **Backend** | `ImageStorageService` returns `${APP_UPLOAD_BASE_URL}/{uuid}.ext` |
| **Status** | ✅ Externalized — override via `APP_UPLOAD_BASE_URL` env var; default remains `http://localhost:8080/uploads/property-images` |
| **Issue** | Deployments that forget to set `APP_UPLOAD_BASE_URL` will silently use the localhost default. Long-term: replace local disk with S3 / CDN-backed storage. |

---

### INT-10: Pagination — `parsePage` Utility Replaces Fragile Unwrapping ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Frontend** | [normalizers.js](frontend/src/utils/normalizers.js) — `parsePage(data)` utility; [PropertyList.jsx](frontend/src/components/property/PropertyList.jsx), [DealPipeline.jsx](frontend/src/features/transactions/DealPipeline.jsx), [MyTransactions.jsx](frontend/src/features/transactions/MyTransactions.jsx), [OwnerSubmissions.jsx](frontend/src/features/property/OwnerSubmissions.jsx) |
| **Backend** | Unchanged — `GET /properties` and `GET /properties/search` return `Page<T>`; deal/user endpoints return raw `List<T>` |
| **Status** | ✅ Robust — `parsePage` normalises both shapes to `{ items, totalPages, totalElements, number }` |
| **Resolution** | `parsePage(data)` exported from `normalizers.js`. If `data` is an array it wraps it as `totalPages: 1`. If it is a Spring Page it reads `.content`, `.totalPages`, and `.totalElements`. All four occurrences of `response.data.content \|\| response.data \|\| []` replaced. `MyTransactions` and `PropertyList` also replace the fragile `response.data.totalPages ?? 1` reads with `page.totalPages` from `parsePage`. |

---

### INT-11: CORS Origin Hardcoded to localhost:5173

| Field | Value |
|-------|-------|
| **Frontend** | Connects to `VITE_API_BASE_URL=http://localhost:8080/api` |
| **Backend** | `SecurityConfig` reads `@Value("${cors.allowed-origins:http://localhost:5173}")` and passes it to `configuration.setAllowedOrigins(List.of(allowedOrigin))` |
| **Status** | ✅ Externalized — override via `CORS_ALLOWED_ORIGINS` env var or `cors.allowed-origins` property |
| **Issue** | The default fallback `http://localhost:5173` remains, so deployments that forget to set the env var silently use the dev origin. Consider removing the `:http://localhost:5173` fallback or making startup fail-fast when the variable is absent in non-dev profiles. |

---

### INT-12: Auth Token Storage — sessionStorage XSS Risk Trade-Off

| Field | Value |
|-------|-------|
| **Frontend** | Tokens stored in `sessionStorage` (tab-scoped, independently testable per tab) |
| **Backend** | Stateless JWT |
| **Status** | ⚠️ Acceptable for internal/dev; higher risk for public-facing deployment |
| **Issue** | `sessionStorage` is readable by JavaScript — any XSS vulnerability exposes tokens. `HttpOnly` cookies for the refresh token would be stronger. |
| **Fix** | For hardened deployment: store refresh token in `HttpOnly Secure SameSite=Strict` cookie; keep access token short-lived in memory only. |

---

### INT-13: Site Visit Request — DateTime Format Explicit ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Frontend** | [SiteVisitModal.jsx](frontend/src/components/property/SiteVisitModal.jsx) — sends `visitDateTime: visitDateTime + ':00'` (result: `"2025-12-01T10:30:00"`) |
| **Backend** | [SiteVisitRequest.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/SiteVisitRequest.java) — `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime visitDateTime` |
| **Status** | ✅ Compatible and explicit |
| **Resolution** | `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")` added to `visitDateTime`. Deserialization no longer relies on Jackson's implicit ISO-8601 fallback; a malformed string now produces a 400 with a structured error rather than an uncontrolled 400. |

---

### INT-14: Site Visit Status Update — Enum Deserialization Hardened ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Frontend** | [BrokerVisitRequests.jsx](frontend/src/features/visits/BrokerVisitRequests.jsx) — sends `{ status: "CONFIRMED" }` |
| **Backend** | [VisitStatus.java](backend/src/main/java/com/dayforce/backend/domain/entity/enums/VisitStatus.java) — `@JsonCreator fromValue(String)` |
| **Status** | ✅ Compatible and hardened |
| **Resolution** | `@JsonCreator fromValue(String)` added to `VisitStatus`. It normalises to upper-case before matching, so `"confirmed"` or `"Confirmed"` are accepted alongside `"CONFIRMED"`. Unknown values return `null`, which is caught by `@NotNull` + `@ValidBrokerVisitStatus` with a clean 400 message rather than an opaque Jackson parse exception. |

---

### INT-15: Site Visit Response — Field Consumption ★ NEW

| Field | Value |
|-------|-------|
| **Frontend** | [MyVisits.jsx](frontend/src/features/visits/MyVisits.jsx) and [BrokerVisitRequests.jsx](frontend/src/features/visits/BrokerVisitRequests.jsx) consume `visit.id`, `visit.propertyId`, `visit.propertyTitle`, `visit.propertyCity`, `visit.brokerName`, `visit.customerName`, `visit.visitDateTime`, `visit.status`, `visit.notes`, `visit.createdAt` |
| **Backend** | [SiteVisitResponse.java](backend/src/main/java/com/dayforce/backend/application/dto/sitevisit/SiteVisitResponse.java) — exposes all the same fields under identical names |
| **Status** | ✅ Fully compatible — no normalizer needed; field names are already aligned |

---

### INT-16: Site Visit Cancellation — Optimistic UI vs 204 ★ NEW

| Field | Value |
|-------|-------|
| **Frontend** | [MyVisits.jsx](frontend/src/features/visits/MyVisits.jsx) — `handleCancel` calls `api.delete(...)` then does `setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'CANCELLED' } : v))` |
| **Backend** | [SiteVisitController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/SiteVisitController.java) — `cancelVisit` returns `204 No Content` |
| **Status** | ✅ Compatible |
| **Issue** | None. The optimistic update is correct — on success (204) the card stays in the list with status changed to CANCELLED; on error the toast shows the backend message without modifying state. |

---

### INT-17: Site Visit — Timezone Mismatch Resolved ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Frontend** | [SiteVisitModal.jsx](frontend/src/components/property/SiteVisitModal.jsx) — `minDateTime` built from local-time components (`getFullYear/Month/Date/Hours/Minutes`) |
| **Backend** | [BackendApplication.java](backend/src/main/java/com/dayforce/backend/BackendApplication.java) — JVM pinned to UTC; [SiteVisitService.java](backend/src/main/java/com/dayforce/backend/application/service/SiteVisitService.java) — guard uses `LocalDateTime.now(ZoneOffset.UTC)` |
| **Status** | ✅ Timezone-consistent |
| **Resolution** | (1) Frontend: `minDateTime` now built from `getFullYear/getMonth/getDate/getHours/getMinutes` rather than `toISOString().slice(0,16)`, which was producing a UTC-offset value as the `datetime-local` minimum. (2) Backend: `TimeZone.setDefault(TimeZone.getTimeZone("UTC"))` called before `SpringApplication.run` in `BackendApplication.main` — `@Future` and any `LocalDateTime.now()` evaluate against UTC. (3) Belt-and-suspenders guard in `SiteVisitService.requestVisit` updated to `LocalDateTime.now(ZoneOffset.UTC)` for consistency with the pinned JVM timezone. |

---

## Part 5: Test Coverage Analysis

### 5.1 Backend Tests

| File | Coverage area |
|------|--------------|
| `AuthServiceTest.java` | Registration, login, refresh token flows |
| `DealServiceTest.java` | Create deal, advance pipeline, broker pipeline |
| `FavoriteServiceTest.java` | Add, remove, list, check favorites |
| `UserServiceTest.java` | Profile fetch, password change, metrics |
| `GlobalExceptionHandlerTest.java` | Exception → HTTP status mappings (incl. `IllegalStateException` ✅, `DataIntegrityViolationException` ✅) |
| `DealSpecificationTest.java` | Specification predicate building |
| `PropertyControllerTest.java` | HTTP layer for property endpoints |
| `SiteVisitServiceTest.java` | ★ NEW — 16 cases: `requestVisit` (success + 6 guard paths), `getMyVisits`, `cancelVisit` (4 states), `updateVisitStatus` (4 valid transitions + terminal + non-owner + 404), `getBrokerVisitRequests` |
| `SiteVisitControllerTest.java` | ★ NEW — 13 cases: all 5 endpoints, role-guard 403s, ResourceNotFoundException 404, terminal-state 400, optimistic-cancel 204 |
| `BackendApplicationTests.java` | Spring context loads (smoke test) |

**Remaining gaps:**
- No `PropertyServiceTest` — the most complex service (consensus engine, coordinate geocoding, `validateAmenities`, `applyCoordinates`) has zero unit test coverage
- No `ProximityServiceTest` — geocode cascade logic, Overpass fallback endpoints, radius retry untested
- No `ImageStorageServiceTest` — MIME validation, path-traversal guard, UUID naming untested

### 5.2 Frontend Tests

| File | Coverage area |
|------|--------------|
| `Login.test.jsx` | Field rendering, validation errors, success dispatch |
| `Register.test.jsx` | Field rendering, validation, success navigation |
| `PropertyForm.test.jsx` | Required fields, validation, pre-fill, loading state |
| `PropertyCard.test.jsx` | Rendering, save/unsave toggle |
| `PropertyDetails.test.jsx` | Loading state, error state, detail rendering |
| `MyTransactions.test.jsx` | Table rendering, filter, sort |
| `DealPipeline.test.jsx` | Column rendering, advance action |
| `ProtectedRoute.test.jsx` | Role gate, unauthenticated redirect |
| `SiteVisitModal.test.jsx` | ★ NEW — 10 cases: hidden when closed, date required validation, ISO-8601 `:00` suffix, blank notes → null, notes text sent, `maxLength=500` attribute, success toast + `onSuccess`, API error surfaced, fallback error, backdrop close |
| `MyVisits.test.jsx` | ★ NEW — 11 cases: loading, empty state, fetch error, card rendering, Cancel shown for REQUESTED/CONFIRMED + hidden for COMPLETED/CANCELLED, optimistic update, error toast preserves state, notes and broker name rendering |
| `BrokerVisitRequests.test.jsx` | ★ NEW — 13 cases: loading, fetch error, card rendering, ALL/REQUESTED/CONFIRMED/COMPLETED tab filtering, empty-category state, Confirm → PATCH CONFIRMED, Mark Complete → PATCH COMPLETED, Cancel → PATCH CANCELLED, error toast, no action buttons on terminal visits |

**Remaining gaps:**
- No `PropertyList.test.jsx` — filter application, map/list toggle, pagination untested
- No `ProximityAmenities.test.jsx` — complex auto-fetch + manual fallback + 3-type validation untested
- No `TransactionModal.test.jsx` — rental date validation (required, end > start) untested
- No `api.js` interceptor test — refresh-token queue behavior under concurrent 401s untested
- No `BrokerAnalytics.test.jsx` — chart data preparation logic untested
- No E2E tests (Playwright/Cypress) for complete user journeys (register → list → buy, broker → add → approve → close, customer → schedule visit → broker confirms)

---

## Part 6: Recommended Next-Version Features

### F-01: Server-Side Token Revocation (Logout + Blocklist)

| Field | Value |
|-------|-------|
| **Value** | High — closes the stolen-refresh-token gap and enables logout |
| **Effort** | Medium |
| **Dependencies** | Redis (preferred) or DB table for JTI blocklist |
| **Category** | Security |
| **Description** | Add `POST /api/auth/logout`. Store the token's JTI in a Redis SET with expiry equal to the refresh token's remaining TTL. `JwtAuthenticationFilter` checks the blocklist on every request. On explicit logout and on `POST /api/auth/refresh`, both tokens are revoked. |

---

### F-02: Login Rate Limiting & Account Lockout

| Field | Value |
|-------|-------|
| **Value** | High — prevents brute-force attacks on login |
| **Effort** | Low–Medium |
| **Dependencies** | Bucket4j or Spring's `RateLimiter`; optionally Redis for distributed state |
| **Category** | Security |
| **Description** | Track failed login attempts per email. Soft-lock for 15 minutes after 5 consecutive failures. Return `429 Too Many Requests` with `Retry-After` header. Expose lockout state to frontend for user-friendly messaging. |

---

### F-03: Cloud Image Storage (S3-Compatible)

| Field | Value |
|-------|-------|
| **Value** | High — required before any cloud deployment |
| **Effort** | Medium |
| **Dependencies** | AWS S3 / Cloudflare R2 / MinIO; Spring Cloud AWS or AWS SDK |
| **Category** | Infrastructure |
| **Description** | Replace `ImageStorageService`'s local disk writes with S3 `PutObject`. Return CDN-backed public URLs. Eliminates the `localhost:8080` base-URL problem and horizontal scaling issues. |

---

### F-04: Deal Cancellation / Void Flow

| Field | Value |
|-------|-------|
| **Value** | High — current gap leaves customers with no recourse on a PENDING deal |
| **Effort** | Medium |
| **Dependencies** | New `DealStatus.CANCELLED` enum value; optional notification system |
| **Category** | Feature |
| **Description** | Allow customers to cancel a PENDING deal (before UNDER_CONTRACT). Allow brokers to void any deal with a required reason. On cancellation, set property back to AVAILABLE and notify both parties. |

---

### F-05: Property Resubmit After Rejection

| Field | Value |
|-------|-------|
| **Value** | Medium — resolves the current UX dead-end for rejected submissions |
| **Effort** | Low |
| **Dependencies** | None |
| **Category** | Feature |
| **Description** | Add "Edit & Resubmit" button on `MySubmissions` for REJECTED cards. Backend: verify caller is the property owner and status is REJECTED, then clear rejections and set status back to PENDING and `broker = null`. |

---

### F-06: Full-Text Property Search

| Field | Value |
|-------|-------|
| **Value** | High — most requested feature in real estate apps |
| **Effort** | Medium |
| **Dependencies** | MySQL FULLTEXT index or Elasticsearch |
| **Category** | Feature |
| **Description** | Add FULLTEXT index on `title`, `configuration`, `city`, `locality`. Expose a `q` param in `PropertyCriteria`. `PropertySpecification` issues `MATCH...AGAINST` when `q` is present. Frontend adds a prominent search bar. |

---

### F-07: In-App Notification System

| Field | Value |
|-------|-------|
| **Value** | Medium-High — drives re-engagement and real-time deal visibility |
| **Effort** | High |
| **Dependencies** | WebSocket (STOMP) or SSE; Notification entity |
| **Category** | Feature / UX |
| **Description** | Push real-time notifications for: deal created/advanced, submission approved/rejected, new submission received (broker). Unread badge in Navbar. Notifications page with read/unread state. |

---

### F-08: Paginated Deal Endpoints

| Field | Value |
|-------|-------|
| **Value** | Medium — scalability requirement |
| **Effort** | Low |
| **Dependencies** | None |
| **Category** | Performance |
| **Description** | Convert `getCustomerTransactions` and `getBrokerPipeline` to return `Page<DealResponse>`. Accept `page` and `size` params. Update `MyTransactions.jsx` and `DealPipeline.jsx` to handle the paginated wrapper. |

---

### F-09: Mortgage / Affordability Calculator

| Field | Value |
|-------|-------|
| **Value** | Medium — high engagement, zero backend dependency |
| **Effort** | Low |
| **Dependencies** | None (client-side only) |
| **Category** | Feature / UX |
| **Description** | Add a calculator panel on `PropertyDetails` for SELL listings. Inputs: principal (pre-filled from `offerCost`), down payment %, interest rate %, tenure (years). Output: monthly EMI and total interest. Entirely client-side computation. |

---

### F-10: Email Verification on Registration

| Field | Value |
|-------|-------|
| **Value** | Medium — prevents fake accounts; improves data quality |
| **Effort** | Medium |
| **Dependencies** | SMTP provider (SendGrid/SES); token store (DB or Redis) |
| **Category** | Security / Feature |
| **Description** | Generate a time-limited (24h) email verification token on registration. Block login until verified (or allow limited access). Add `GET /api/auth/verify?token=` endpoint. Mark `User.emailVerified` flag. |

---

## Part 7: Priority Fix List (Round 4 Revision)

> Items ~~struck through~~ are now resolved. Open items carry their last-known status.

| # | Fix | Severity | Effort | Status |
|---|-----|----------|--------|--------|
| 1 | ~~Handle `IllegalStateException` in `GlobalExceptionHandler`~~ | ~~High~~ | ~~5 min~~ | ✅ Done |
| 2 | **Remove hardcoded JWT secret fallback** from `application-dev.yml`; change `${JWT_SECRET:404E...}` → `${JWT_SECRET}` with no default; add `@PostConstruct` sanity check in `JwtService` | **Critical** | 15 min | ❌ Open |
| 3 | ~~Fix `findByOwner_Id` → `findByOwner_IdAndIsDeletedFalse` in `UserService`~~ | ~~Medium~~ | ~~5 min~~ | ✅ Done |
| 4 | ~~Restrict `GET /api/deals/property/{propertyId}`~~ | ~~Medium~~ | ~~30 min~~ | ✅ Done |
| 5 | ~~Add `maxLength={500}` to `SiteVisitModal` textarea~~ \u2705 Done. **Still open:** add `@Size(max=500)` to `SiteVisitRequest.notes` and `@ExceptionHandler(DataIntegrityViolationException.class)` in `GlobalExceptionHandler` | **Medium** | 5 min | \u26a0\ufe0f Partial |
| 6 | **Cancel active site visits on property delete and deal close** — inject `SiteVisitRepository` into `PropertyService.deleteProperty` and `DealService.advanceDealStatus`; bulk-cancel REQUESTED/CONFIRMED visits | **Medium** | 30 min | ❌ Open |
| 7 | ~~Guard `deleteProperty` against active deals — `dealRepository.existsByProperty_PropIdAndStatusNot`~~ | ~~Medium~~ | ~~20 min~~ | ✅ Done |
| 8 | ~~Fix password placeholder text in `Register.jsx`~~ | ~~Low~~ | ~~1 min~~ | ✅ Done |
| 9 | **Remove duplicate `/properties` and `/properties/:id` routes** from the Customer-only block in `App.jsx` | Low | 5 min | ❌ Open |
| 10 | ~~Add `GET /api/users/me/analytics` to SecurityConfig under `hasRole("BROKER")`~~ | ~~Low~~ | ~~5 min~~ | ✅ Done |
| 11 | ~~Relax `UserProfileUpdateRequest.mobile` from `@NotBlank` to `@Size(max=20)`~~ | ~~Low~~ | ~~5 min~~ | ✅ Done |
| 12 | **Add `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")` to `SiteVisitRequest.visitDateTime`** to make deserialization explicit | Low | 5 min | ❌ Open |

---

## Part 8: Top 5 Next Features

| # | Feature | Value | Effort |
|---|---------|-------|--------|
| 1 | **Server-side logout + token revocation** (Redis JTI blocklist, `POST /auth/logout`) | High | Medium |
| 2 | **Login rate limiting + account lockout** (Bucket4j, 5 attempts / 15 min soft-lock) | High | Low–Medium |
| 3 | **Cloud image storage** (S3 / R2, replace local disk, externalize base URL) | High | Medium |
| 4 | **Deal cancellation flow** (new `CANCELLED` status, customer-initiated before UNDER_CONTRACT, property re-AVAILABLE) | High | Medium |
| 5 | **Property resubmit after rejection** ("Edit & Resubmit" on MySubmissions, reset to PENDING) | Medium | Low |

---

## Part 9: Major Test Gaps

| Gap | Risk | Recommended Action |
|-----|------|--------------------|
| No `SiteVisitServiceTest` ★ | State-machine transitions, broker ownership, duplicate-visit guard untested — defects in the newest feature have zero automated backstop | Add unit tests for all 5 service methods; use Mockito for repository stubs |
| No `SiteVisitControllerTest` ★ | HTTP layer role-gating for 5 new endpoints untested | Add `@WebMvcTest` tests for each endpoint with both correct and forbidden roles |
| No `MyVisits.test.jsx` / `BrokerVisitRequests.test.jsx` / `SiteVisitModal.test.jsx` ★ | Site Visit UI has no coverage: cancel action, confirm/complete/cancel broker actions, notes overflow, duplicate-visit error not tested | Add vitest + Testing Library tests with MSW mocks |
| No `PropertyServiceTest` | Consensus engine, amenity validation, coordinate geocoding completely untested | Add unit tests for `createProperty`, `updatePropertyStatus`, `validateAmenities`, `applyCoordinates` |
| No `IllegalStateException` test in `GlobalExceptionHandlerTest` | BUG-01 would have been caught immediately by a single test — pattern to learn from | Add `@Test void illegalState_returns400()` |
| No `ProximityServiceTest` | Geocode cascade, radius retry, Overpass fallback untested | Add with WireMock stubbing of Nominatim + Overpass |
| No `ImageStorageServiceTest` | Path-traversal guard, MIME validation, UUID naming untested | Unit test `store()` with malicious input edge cases |
| No `PropertyList.test.jsx` | Filter application, map/list toggle, pagination untested | Add with MSW to mock API responses |
| No `api.js` interceptor test | Refresh-token queue behavior under concurrent 401s untested — this is business-critical | Add with `axios-mock-adapter` or `msw` |
| No `TransactionModal.test.jsx` | Rental date validation (both required, end > start) untested | Add form validation tests |
| No E2E tests | End-to-end user journeys not covered: register → browse → buy, broker → add listing → approve submission → close deal, customer → schedule visit → broker confirms | Add Playwright smoke tests for the three critical paths |
