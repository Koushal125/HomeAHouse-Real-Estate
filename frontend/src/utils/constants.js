export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  BROKER: 'BROKER',
  ADMIN: 'ADMIN'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  // Customer Routes
  CUSTOMER_DASHBOARD: '/dashboard/customer',
  MY_PROPERTIES: '/my-properties',
  MY_TRANSACTIONS: '/my-transactions',
  SUBMIT_PROPERTY: '/submit-property',
  MY_SUBMISSIONS: '/my-submissions',
  SAVED_LISTINGS: '/saved-listings',
  PROPERTY_PREVIEW: '/properties/preview',
  // Broker Routes
  BROKER_DASHBOARD: '/dashboard/broker',
  MANAGED_PROPERTIES: '/managed-properties',
  ADD_PROPERTY: '/properties/new',
  OWNER_SUBMISSIONS: '/owner-submissions',
  BROKER_VISIT_REQUESTS: '/broker/visit-requests',
  // Shared
  EMI_CALCULATOR: '/emi-calculator',
  // Customer
  MY_VISITS: '/my-visits',
};