# Implementation Plan - Frontend & Backend Checklists

---

# FRONTEND IMPLEMENTATION CHECKLIST

## Phase 1: Fix Existing Features (P0)

### P0.1 Fix API Contract Mismatches

**Task: Fix Deal Creation API Call**
- **File:** [frontend/src/components/property/TransactionModal.jsx](frontend/src/components/property/TransactionModal.jsx)
- **Current Issue:** Frontend calls `/deals` but backend expects `/deals/{propertyId}`
- **Action:**
  - [ ] Update POST endpoint from `/api/deals` to `/api/deals/${propertyId}`
  - [ ] Pass `propertyId` from parent component props or route params
  - [ ] Test: Initiate deal from PropertyDetails, verify deal creation succeeds

**Task: Fix MyTransactions API Call**
- **File:** [frontend/src/features/transactions/MyTransactions.jsx](frontend/src/features/transactions/MyTransactions.jsx)
- **Current Issue:** Frontend calls `/deals/me` but backend endpoint has typo: `/deals/me/tranactions`
- **Action:**
  - [ ] Update GET endpoint from `/api/deals/me` to `/api/deals/me/tranactions` (temporary, until backend fixes typo)
  - [ ] OR contact backend team to fix typo to `/deals/me/transactions` (preferred)
  - [ ] Test: Load MyTransactions page, verify list populates

**Task: Fix Deal Pipeline API Call**
- **File:** [frontend/src/features/transactions/DealPipeline.jsx](frontend/src/features/transactions/DealPipeline.jsx)
- **Current Issue:** Frontend calls `/deals/broker` but backend endpoint is `/deals/me/pipeline`
- **Action:**
  - [ ] Update GET endpoint from `/api/deals/broker` to `/api/deals/me/pipeline`
  - [ ] Test: Load Deal Pipeline page, verify Kanban board populates with real data

### P0.2 Add Robust Error and Loading States

**Task: PropertyDetails Page**
- **File:** [frontend/src/features/property/PropertyDetails.jsx](frontend/src/features/property/PropertyDetails.jsx)
- **Changes:**
  - [ ] Add `loading` state (useState)
  - [ ] Add `error` state for fetch/API failures
  - [ ] Show spinner/loader while `loading === true`
  - [ ] Show error toast/alert if `error` is set
  - [ ] Disable transaction button if loading or no property
  - Replace inline fetch call with:
    ```javascript
    useEffect(() => {
      setLoading(true);
      api.get(`/properties/${id}`)
        .then(res => setProperty(res.data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }, [id]);
    ```

**Task: MyTransactions Page**
- **File:** [frontend/src/features/transactions/MyTransactions.jsx](frontend/src/features/transactions/MyTransactions.jsx)
- **Changes:**
  - [ ] Add `loading` state
  - [ ] Add `error` state
  - [ ] Add `empty` state (no transactions)
  - [ ] Show spinner while loading
  - [ ] Show "No transactions yet" message if array is empty
  - [ ] Show error message if fetch fails

**Task: DealPipeline Page**
- **File:** [frontend/src/features/transactions/DealPipeline.jsx](frontend/src/features/transactions/DealPipeline.jsx)
- **Changes:**
  - [ ] Add `loading` state
  - [ ] Add `error` state
  - [ ] Show spinner while loading
  - [ ] Show error message if pipeline fetch fails
  - [ ] Group deals by status correctly once real data arrives

**Task: ManagedProperties Page**
- **File:** [frontend/src/features/property/ManagedProperties.jsx](frontend/src/features/property/ManagedProperties.jsx)
- **Changes:**
  - [ ] Add `loading` state
  - [ ] Add `error` state for delete/fetch failures
  - [ ] Show spinner while loading properties
  - [ ] Disable delete button while operation in progress
  - [ ] Show success toast after delete

**Task: OwnerSubmissions Page**
- **File:** [frontend/src/features/property/OwnerSubmissions.jsx](frontend/src/features/property/OwnerSubmissions.jsx)
- **Changes:**
  - [ ] Add `loading` state
  - [ ] Add `error` state
  - [ ] Add `actioning` state when approve/reject is clicked
  - [ ] Show spinner while fetching pending submissions
  - [ ] Disable approve/reject buttons while actioning
  - [ ] Show success toast after approval/rejection

### P0.3 Standardize Status Labels and Enums

**Task: Create Enums Reference File**
- **File:** [frontend/src/utils/enums.js](frontend/src/utils/enums.js) (new file)
- **Content:**
  ```javascript
  // Property statuses
  export const PROPERTY_STATUS = {
    AVAILABLE: 'AVAILABLE',
    RESERVED: 'RESERVED',
    RENTED: 'RENTED',
    SOLD: 'SOLD',
    OFF_MARKET: 'OFF_MARKET'
  };

  // Deal statuses (if used by backend)
  export const DEAL_STATUS = {
    PENDING: 'PENDING',
    UNDER_CONTRACT: 'UNDER_CONTRACT',
    CLOSED_WON: 'CLOSED_WON',
    CLOSED_LOST: 'CLOSED_LOST'
  };

  // Offer/listing types
  export const OFFER_TYPE = {
    SELL: 'SELL',
    RENT_LONG_TERM: 'RENT_LONG_TERM',
    RENT_SHORT_TERM: 'RENT_SHORT_TERM'
  };

  // Property types
  export const PROPERTY_TYPE = {
    FLAT: 'FLAT',
    SHOP: 'SHOP',
    PLOT: 'PLOT',
    APARTMENT: 'APARTMENT',
    HOUSE: 'HOUSE',
    VILLA: 'VILLA',
    COMMERCIAL: 'COMMERCIAL'
  };

  // Helper to display status as user-friendly label
  export const getPropertyStatusLabel = (status) => {
    const labels = {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      RENTED: 'Rented',
      SOLD: 'Sold',
      OFF_MARKET: 'Off Market'
    };
    return labels[status] || status;
  };
  ```
- **Actions:**
  - [ ] Create file above
  - [ ] Import in PropertyCard, PropertyDetails, PropertyList, ManagedProperties
  - [ ] Replace hardcoded status strings with enum references
  - [ ] Replace hardcoded status display logic with `getPropertyStatusLabel(status)`

**Task: Update PropertyForm with Standardized Enums**
- **File:** [frontend/src/components/property/PropertyForm.jsx](frontend/src/components/property/PropertyForm.jsx)
- **Changes:**
  - [ ] Import enums from utils/enums.js
  - [ ] Replace hardcoded dropdown options with enum values
  - [ ] Example for property type dropdown:
    ```javascript
    <select name="type" value={formData.type} onChange={handleChange}>
      <option value="">Select Type</option>
      {Object.values(PROPERTY_TYPE).map(type => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
    ```

### P0.4 Improve Notification/Toast System

**Task: Install Toast Library (if not present)**
- **File:** [frontend/package.json](frontend/package.json)
- **Action:**
  - [ ] Check if `react-toastify` is already installed
  - If not installed, run: `npm install react-toastify`
  - [ ] If using Tailwind, alternatively implement simple toast context

**Task: Create Toast Context (if custom)**
- **File:** [frontend/src/context/ToastContext.jsx](frontend/src/context/ToastContext.jsx) (new file)
- **Content:**
  ```javascript
  import React, { createContext, useState, useCallback } from 'react';

  export const ToastContext = createContext();

  export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }, []);

    return (
      <ToastContext.Provider value={{ showToast, toasts }}>
        {children}
      </ToastContext.Provider>
    );
  };
  ```
- [ ] Wrap App.jsx with ToastProvider
- [ ] Create [frontend/src/components/Toast.jsx](frontend/src/components/Toast.jsx) for rendering

**Task: Wire Toast to All Critical Actions**
- **Files to update:**
  - [ ] [ManagedProperties.jsx](frontend/src/features/property/ManagedProperties.jsx) - show toast on delete success/failure
  - [ ] [AddProperty.jsx](frontend/src/features/property/AddProperty.jsx) - show toast on create success/failure
  - [ ] [EditProperty.jsx](frontend/src/features/property/EditProperty.jsx) - show toast on update success/failure
  - [ ] [Profile.jsx](frontend/src/features/profile/Profile.jsx) - show toast on profile/password update
  - [ ] [OwnerSubmissions.jsx](frontend/src/features/property/OwnerSubmissions.jsx) - show toast on approve/reject
  - **Action:** Add `useToast()` hook call and dispatch `showToast()` in catch/success blocks

### P0.5 Add Authorization Guards to Sensitive Pages

**Task: Verify ProtectedRoute Enforcement**
- **File:** [frontend/src/components/common/ProtectedRouteFile.jsx](frontend/src/components/common/ProtectedRouteFile.jsx)
- **Changes:**
  - [ ] Confirm route checks `user.role` matches allowed roles
  - [ ] Confirm redirect to `/login` if unauthenticated
  - [ ] Confirm redirect to appropriate dashboard if wrong role
- **Test:**
  - [ ] Login as broker, try accessing `/customer-dashboard` → should redirect
  - [ ] Login as customer, try accessing `/admin` (if exists) → should redirect

---

## Phase 2: Complete Partial Features (P1)

### P1.1 Dashboard Stats Integration

**Task: Customer Dashboard - Real Stats**
- **File:** [frontend/src/features/dashboard/CustomerDashboard.jsx](frontend/src/features/dashboard/CustomerDashboard.jsx)
- **Changes:**
  - [ ] Add state for stats: `ownedProperties`, `activeRentals`, `savedListings`
  - [ ] Fetch customer profile with related data: `GET /users/me`
  - [ ] Populate stats from response:
    ```javascript
    useEffect(() => {
      api.get('/users/me')
        .then(res => {
          setStats({
            ownedProperties: res.data.properties?.length || 0,
            activeRentals: res.data.rentals?.length || 0,
            savedListings: res.data.savedListings?.length || 0
          });
        });
    }, []);
    ```
  - [ ] Test: Verify stats update when properties are added/removed

**Task: Broker Dashboard - Real Stats**
- **File:** [frontend/src/features/dashboard/BrokerDashboard.jsx](frontend/src/features/dashboard/BrokerDashboard.jsx)
- **Changes:**
  - [ ] Add state for stats: `activeListings`, `dealsClosedCount`, `newSubmissions`
  - [ ] Fetch broker metrics: `GET /brokers/me/metrics` (backend must provide)
  - [ ] Populate stats from response
  - [ ] Test: Verify stats update after property/deal actions

### P1.2 Improve Transaction History UX

**Task: MyTransactions - Add Sorting and Filtering**
- **File:** [frontend/src/features/transactions/MyTransactions.jsx](frontend/src/features/transactions/MyTransactions.jsx)
- **Changes:**
  - [ ] Add filter dropdown for deal status (All, Pending, Closed Won, Closed Lost)
  - [ ] Add sort dropdown (Date Desc/Asc, Amount Desc/Asc)
  - [ ] Apply filters and sorts before displaying table
  - [ ] Update table columns to show: Property Title, Type, Amount, Date, Status, Actions
  - [ ] Test: Filter and sort work correctly

### P1.3 Improve Deal Pipeline UX

**Task: DealPipeline - Fix Grouping by Status**
- **File:** [frontend/src/features/transactions/DealPipeline.jsx](frontend/src/features/transactions/DealPipeline.jsx)
- **Changes:**
  - [ ] Ensure data from `/deals/me/pipeline` is grouped by status correctly
  - [ ] Display three columns: "New Offers", "Under Contract", "Closed Won"
  - [ ] Ensure drag-drop or status update buttons work (if implemented)
  - [ ] Test: Load pipeline, verify deals appear in correct columns

---

## Phase 3: Add Missing Features (P2)

### P2.1 Saved Listings / Favorites

**Task: Add Save/Unsave Button to PropertyCard**
- **File:** [frontend/src/components/property/PropertyCard.jsx](frontend/src/components/property/PropertyCard.jsx)
- **Changes:**
  - [ ] Add `saved` state (boolean)
  - [ ] Add heart icon button for save/unsave
  - [ ] On click, POST to `/api/favorites` or `/api/saved-listings` with propertyId
  - [ ] Toggle heart fill on success
  - [ ] Show toast notification

**Task: Create Saved Listings Page**
- **File:** [frontend/src/features/property/SavedListings.jsx](frontend/src/features/property/SavedListings.jsx) (new file)
- **Content:**
  - [ ] Fetch saved properties from backend: `GET /api/favorites` or `/api/saved-listings`
  - [ ] Display as list of PropertyCards
  - [ ] Show empty state if no saved properties
  - [ ] Allow unsave action from this page

**Task: Add Saved Listings Route**
- **File:** [frontend/src/App.jsx](frontend/src/App.jsx)
- **Changes:**
  - [ ] Add route: `/customer/saved-listings` with SavedListings component
  - [ ] Protect route (customer role only)

**Task: Wire Dashboard Saved Count**
- **File:** [frontend/src/features/dashboard/CustomerDashboard.jsx](frontend/src/features/dashboard/CustomerDashboard.jsx)
- **Changes:**
  - [ ] Update `savedListings` stat from `GET /api/favorites`
  - [ ] Make stat clickable to navigate to `/customer/saved-listings`

---

## Phase 4: Production Hardening (P3)

### P3.1 Add Frontend Tests

**Task: Route Protection Tests**
- **File:** [frontend/src/__tests__/ProtectedRoute.test.jsx](frontend/src/__tests__/ProtectedRoute.test.jsx) (new file)
- **Content:** Test role-based redirects

**Task: Form Validation Tests**
- **File:** [frontend/src/__tests__/PropertyForm.test.jsx](frontend/src/__tests__/PropertyForm.test.jsx) (new file)
- **Content:** Test property form validation

---

---

# BACKEND IMPLEMENTATION CHECKLIST

## Phase 1: Fix Existing Features (P0)

### P0.1 Fix API Endpoint Naming

**Task: Fix Transaction Endpoint Typo**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java)
- **Current Issue:** Endpoint is `/deals/me/tranactions` (typo: should be `transactions`)
- **Action:**
  - [ ] Find method with `@GetMapping("/me/tranactions")`
  - [ ] Change to `@GetMapping("/me/transactions")`
  - [ ] Verify frontend also updates call to `/api/deals/me/transactions`
  - [ done ] Test: GET `/deals/me/transactions` returns customer's deals

**Task: Clarify Deal Pipeline Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/DealController.java)
- **Current Issue:** Endpoint naming unclear (should match frontend expectation)
- **Action:**
  - [ ] Verify endpoint `GET /deals/me/pipeline` or `GET /deals/broker` exists
  - [ ] Ensure it filters deals by broker (authenticatedUser.getId())
  - [ ] Ensure it groups/returns deals with status field
  - [ done ] Test: Returns broker-specific deals

### P0.2 Add Missing but Critical API Endpoints

**Task: Create or Verify Profile Update Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java)
- **Check exists:** `PUT /users/me`
- **If missing:**
  - [ ] Add method:
    ```java
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, @AuthenticationPrincipal UserDetails userDetails) {
      User user = userService.findByEmail(userDetails.getUsername());
      user.setName(request.getName());
      user.setPhone(request.getPhone());
      user.setCity(request.getCity());
      userService.update(user);
      return ResponseEntity.ok(userMapper.toDTO(user));
    }
    ```
  - [ ] Create UpdateProfileRequest DTO with name, phone, city
  - [ ] Test: POST profile update works

**Task: Create or Verify Change Password Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java)
- **Check exists:** `PUT /users/me/password`
- **If missing:**
  - [ ] Add method:
    ```java
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, @AuthenticationPrincipal UserDetails userDetails) {
      User user = userService.findByEmail(userDetails.getUsername());
      if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
        return ResponseEntity.status(401).body("Current password incorrect");
      }
      if (!request.getNewPassword().equals(request.getConfirmPassword())) {
        return ResponseEntity.status(400).body("Passwords do not match");
      }
      user.setPassword(passwordEncoder.encode(request.getNewPassword()));
      userService.update(user);
      return ResponseEntity.ok("Password changed successfully");
    }
    ```
  - [ ] Create ChangePasswordRequest DTO with currentPassword, newPassword, confirmPassword
  - [ done ] Test: Password change works with validation

### P0.3 Add Validation and Authorization Checks

**Task: Validate Deal Creation Authorization**
- **File:** [backend/src/main/java/com/dayforce/backend/application/service/DealService.java](backend/src/main/java/com/dayforce/backend/application/service/DealService.java)
- **Changes:**
  - [ ] Ensure only CUSTOMER role can create deals
  - [ ] Ensure property exists and status is AVAILABLE
  - [ done ] Ensure customer doesn't already have deal on this property
  - Add validation:
    ```java
    public Deal createDeal(Long propertyId, CreateDealRequest request, User customer) {
      if (!"CUSTOMER".equals(customer.getRole().name())) {
        throw new UnauthorizedException("Only customers can create deals");
      }
      Property property = propertyRepository.findById(propertyId)
        .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
      if (!"AVAILABLE".equals(property.getStatus().name())) {
        throw new BusinessException("Property is not available for purchase");
      }
      // Create deal, update property status
      Deal deal = new Deal();
      deal.setProperty(property);
      deal.setCustomer((Customer) customer);
      deal.setOfferAmount(request.getOfferAmount());
      deal.setOfferType(request.getOfferType());
      // Update property status based on offer type
      if ("SELL".equals(request.getOfferType())) {
        property.setStatus(PropertyStatus.SOLD);
      } else {
        property.setStatus(PropertyStatus.RENTED);
      }
      return dealRepository.save(deal);
    }
    ```

**Task: Validate Broker Ownership on Property Updates**
- **File:** [backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java](backend/src/main/java/com/dayforce/backend/application/service/PropertyService.java)
- **Changes:**
  - [ done ] Before edit/delete, ensure authenticatedBroker.id == property.broker.id
  - [ ] Add method:
    ```java
    private void validateBrokerOwnership(Property property, User authenticatedUser) {
      if (!property.getBroker().getId().equals(authenticatedUser.getId())) {
        throw new ForbiddenException("You do not own this property");
      }
    }
    ```

### P0.4 Enhance Response DTOs with Missing Fields

**Task: Verify Deal Response DTO**
- **File:** [backend/src/main/java/com/dayforce/backend/application/dto/deal/DealDTO.java](backend/src/main/java/com/dayforce/backend/application/dto/deal/DealDTO.java)
- **Check includes:** id, propertyId, propertyTitle, customerId, customerName, offerAmount, offerType, dealStatus, createdDate, startDate, endDate
- **If missing:**
  - [ ] Add missing fields to DTO
  - [ ] Update mapper to populate from Entity

**Task: Verify Property Response DTO**
- **File:** [backend/src/main/java/com/dayforce/backend/application/dto/property/PropertyDTO.java](backend/src/main/java/com/dayforce/backend/application/dto/property/PropertyDTO.java)
- **Check includes:** id, title, description, type, offerType, price, bedrooms, bathrooms, furnished, address, city, status, brokerId, brokerName, imageUrls, createdDate, updatedDate
- **If missing:**
  - [ ] Add fields
  - [ ] Update mapper --- need to add image url

### P0.5 Add Consistent Error Response Model

**Task: Create Error Response DTO**
- **File:** [backend/src/main/java/com/dayforce/backend/application/dto/ErrorResponseDTO.java](backend/src/main/java/com/dayforce/backend/application/dto/ErrorResponseDTO.java) (if missing)
- **Content:**
  ```java - remaining
  @Data
  public class ErrorResponseDTO {
    private int status;
    private String message;
    private String error;
    private LocalDateTime timestamp;
    private String path;
  }
  ```

**Task: Update Global Exception Handler**
- **File:** [backend/src/main/java/com/dayforce/backend/comon/exception/GlobalExceptionHandler.java](backend/src/main/java/com/dayforce/backend/comon/exception/GlobalExceptionHandler.java)
- **Changes:** -- remaining
  - [ ] Add consistent error response formatting for all exceptions
  - [ ] Ensure 401 returns "Unauthorized" for expired tokens
  - [ ] Ensure 403 returns "Forbidden" for insufficient permissions
  - [ ] Ensure 404 returns "Not Found"
  - [ ] Test: Call invalid endpoint, verify error format matches frontend expectation

---

## Phase 2: Complete Partial Features (P1)

### P1.1 Add Dashboard Metrics Endpoints

**Task: Create Customer Metrics Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java)
- **Add method:**
  - [ ] `GET /users/me/metrics`
  - [ ] Return:
    ```java
    {
      "ownedPropertiesCount": 5,
      "activeRentalsCount": 2,
      "savedListingsCount": 3,
      "totalDealsCount": 7
    }
    ```
  - [ ] Query counts from repositories based on authenticated user

**Task: Create Broker Metrics Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/UserController.java)
- **Add method:**
  - [ ] `GET /brokers/me/metrics`
  - [ ] Return:
    ```java
    {
      "activeListingsCount": 10,
      "dealsClosedCount": 23,
      "newSubmissionsCount": 5,
      "totalRevenueAmount": 500000
    }
    ```

### P1.2 Improve Transaction and Pipeline Queries

**Task: Enhance Deal Query for Filters and Sorting**
- **File:** [backend/src/main/java/com/dayforce/backend/infrastructure/specification/DealSpecification.java](backend/src/main/java/com/dayforce/backend/infrastructure/specification/DealSpecification.java) (if missing, create)
- **Add specs for:**
  - [ ] Filter by deal status
  - [ ] Filter by date range
  - [ ] Filter by offer amount range
  - [ ] Sort by date, amount, status
- **Usage in controller:**
  ```java
  @GetMapping("/me/transactions")
  public ResponseEntity<?> getMyTransactions(
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String sortBy,
    @RequestParam(defaultValue = "DESC") String direction) {
    DealSpecification spec = DealSpecification.byCustomerId(customerId);
    if (status != null) spec = spec.and(DealSpecification.byStatus(status));
    Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.valueOf(direction), sortBy));
    return ResponseEntity.ok(dealRepository.findAll(spec, pageable));
  }
  ```

---

## Phase 3: Add Missing Features (P2)

### P2.1 Saved Listings / Favorites

**Task: Create Favorites Entity**
- **File:** [backend/src/main/java/com/dayforce/backend/domain/entity/Favorite.java](backend/src/main/java/com/dayforce/backend/domain/entity/Favorite.java) (new file)
- **Content:**
  ```java
  @Entity
  @Table(name = "favorites")
  @Data
  public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Customer customer;

    @ManyToOne
    private Property property;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
      createdAt = LocalDateTime.now();
    }
  }
  ```

**Task: Create Favorites Repository**
- **File:** [backend/src/main/java/com/dayforce/backend/infrastructure/repository/FavoriteRepository.java](backend/src/main/java/com/dayforce/backend/infrastructure/repository/FavoriteRepository.java) (new file)
- **Content:**
  ```java
  @Repository
  public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByCustomerId(Long customerId);
    Optional<Favorite> findByCustomerIdAndPropertyId(Long customerId, Long propertyId);
    void deleteByCustomerIdAndPropertyId(Long customerId, Long propertyId);
  }
  ```

**Task: Create Favorites Service**
- **File:** [backend/src/main/java/com/dayforce/backend/application/service/FavoriteService.java](backend/src/main/java/com/dayforce/backend/application/service/FavoriteService.java) (new file)
- **Content:**
  ```java
  @Service
  public class FavoriteService {
    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private PropertyRepository propertyRepository;

    public void saveFavorite(Long customerId, Long propertyId) {
      Favorite fav = new Favorite();
      fav.setCustomer(new Customer(customerId));
      fav.setProperty(propertyRepository.findById(propertyId).orElseThrow());
      favoriteRepository.save(fav);
    }

    public void removeFavorite(Long customerId, Long propertyId) {
      favoriteRepository.deleteByCustomerIdAndPropertyId(customerId, propertyId);
    }

    public List<Favorite> getUserFavorites(Long customerId) {
      return favoriteRepository.findByCustomerId(customerId);
    }

    public boolean isFavorited(Long customerId, Long propertyId) {
      return favoriteRepository.findByCustomerIdAndPropertyId(customerId, propertyId).isPresent();
    }
  }
  ```

**Task: Create Favorites Controller Endpoints**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/FavoriteController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/FavoriteController.java) (new file)
- **Endpoints:**
  - [ ] `POST /favorites/{propertyId}` - Save property
  - [ ] `DELETE /favorites/{propertyId}` - Unsave property
  - [ ] `GET /favorites` - List all saved properties
  - [ ] `GET /favorites/{propertyId}/check` - Check if favorited

### P2.2 Property Image Upload

**Task: Create Image Entity**
- **File:** [backend/src/main/java/com/dayforce/backend/domain/entity/PropertyImage.java](backend/src/main/java/com/dayforce/backend/domain/entity/PropertyImage.java) (new file)
- **Content:**
  ```java
  @Entity
  @Table(name = "property_images")
  @Data
  public class PropertyImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "property_id")
    private Property property;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private Integer displayOrder;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
      uploadedAt = LocalDateTime.now();
    }
  }
  ```

**Task: Add Image Upload Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java)
- **Add method:**
  - [ ] `POST /properties/{id}/images` - Upload images (multipart)
  - Store files using a storage service (local or cloud like AWS S3)
  - Return list of saved image URLs
  - Example:
    ```java
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadPropertyImages(
        @PathVariable Long id,
        @RequestParam("files") MultipartFile[] files) {
      // Validate broker ownership
      // Upload files to storage
      // Save PropertyImage records
      return ResponseEntity.ok(imageUrls);
    }
    ```

---

## Phase 4: Production Hardening (P3)

### P3.1 Add Backend Tests

**Task: Add Service Unit Tests**
- **File:** [backend/src/test/java/com/dayforce/backend/application/service/DealServiceTest.java](backend/src/test/java/com/dayforce/backend/application/service/DealServiceTest.java) (new file)
- **Test cases:**
  - [ ] Test deal creation with AVAILABLE property succeeds
  - [ ] Test deal creation with non-AVAILABLE property fails
  - [ ] Test only customers can create deals
  - [ ] Test property status transitions correctly after deal

**Task: Add Controller Integration Tests**
- **File:** [backend/src/test/java/com/dayforce/backend/presentation/controller/PropertyControllerTest.java](backend/src/test/java/com/dayforce/backend/presentation/controller/PropertyControllerTest.java) (new file)
- **Test cases:**
  - [ ] Test unauthorized access to protected endpoints returns 401
  - [ ] Test broker can edit own properties
  - [ ] Test broker cannot edit another's properties (403)
  - [ ] Test customer cannot create properties (403)

### P3.2 Add Logging and Monitoring

**Task: Add Logs to Critical Flows**
- **Files to update:**
  - [ ] AuthService - log successful/failed login attempts
  - [ ] DealService - log deal creations and property status changes
  - [ ] PropertyService - log property CRUD operations
  - **Example:**
    ```java
    @Slf4j
    public class DealService {
      public Deal createDeal(Long propertyId, CreateDealRequest request, User customer) {
        log.info("Creating deal for customer {} on property {}", customer.getId(), propertyId);
        // ... business logic
        log.info("Deal created successfully: {}", deal.getId());
        return deal;
      }
    }
    ```

### P3.3 Add Pagination to List Endpoints

**Task: Update Property List Endpoint**
- **File:** [backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java](backend/src/main/java/com/dayforce/backend/presentation/controller/PropertyController.java)
- **Changes:**
  - [ ] Add `@RequestParam` for page, size, sort
  - [ ] Return `Page<PropertyDTO>` instead of `List<PropertyDTO>`
  - [ ] Example:
    ```java
    @GetMapping
    public ResponseEntity<?> searchProperties(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        PropertyCriteria criteria) {
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
      Page<Property> properties = propertyRepository.findAll(spec, pageable);
      return ResponseEntity.ok(properties.map(propertyMapper::toDTO));
    }
    ```

### P3.4 Add OpenAPI/Swagger Documentation

**Task: Add Swagger Annotations to Controllers**
- **Files to update:**
  - [ ] UserController
  - [ ] PropertyController
  - [ ] DealController
  - [ ] FavoriteController (new)
  - **Example:**
    ```java
    @Operation(summary = "Get current user profile", description = "Fetch authenticated user's profile")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
      // ...
    }
    ```

---

## Summary

**Frontend Priorities:**
1. Fix API endpoint mismatches (P0.1)
2. Add loading/error/empty states (P0.2)
3. Standardize enums and status labels (P0.3)
4. Wire real stats to dashboards (P1.1)
5. Implement saved listings (P2.1)

**Backend Priorities:**
1. Fix endpoint naming typos (P0.1)
2. Verify critical endpoints exist and add missing ones (P0.2)
3. Add validation and authorization (P0.3, P0.4)
4. Create dashboard metrics endpoints (P1.1)
5. Implement saved listings and images (P2.1, P2.2)

**Recommended Order:** Backend P0 → Frontend P0 → Backend P1 & Frontend P1 in parallel → P2/P3
