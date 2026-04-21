import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRouteFile';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import CustomerDashboard from './features/dashboard/CustomerDashboard';
import BrokerDashboard from './features/dashboard/BrokerDashboard';
import Home from './pages/public/Home';
import { ROUTES, ROLES } from './utils/constants';
import AddProperty from './features/property/AddProperty';
import ManagedProperties from './features/property/ManagedProperties';
import EditProperty from './features/property/EditProperty';
import PropertyList from './components/property/PropertyList';
import PropertyDetails from './features/property/PropertyDetails';
import PropertyPreview from './features/property/PropertyPreview';
import SubmitProperty from './features/property/SubmitProperty';
import OwnerSubmissions from './features/property/OwnerSubmissions';
import Profile from './features/profile/Profile';
import MyTransactions from './features/transactions/MyTransactions';
import DealPipeline from './features/transactions/DealPipeline';
import MyProperties from './features/property/MyProperties';
import MySubmissions from './features/property/MySubmissions';
import SavedListings from './features/property/SavedListings';
import BrokerAnalytics from './features/dashboard/BrokerAnalytics';
import EmiCalculatorPage from './features/property/EmiCalculatorPage';
import MyVisits from './features/visits/MyVisits';
import BrokerVisitRequests from './features/visits/BrokerVisitRequests';

function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.BROKER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path={ROUTES.PROPERTY_PREVIEW} element={<PropertyPreview />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.EMI_CALCULATOR} element={<EmiCalculatorPage />} />
        </Route>
      </Route>

      {/* Customer Pages wrapped in DashboardLayout */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.CUSTOMER_DASHBOARD} element={<CustomerDashboard />} />
          <Route path={ROUTES.MY_PROPERTIES} element={<MyProperties />} />
          <Route path={ROUTES.SUBMIT_PROPERTY} element={<SubmitProperty />} />
          <Route path={ROUTES.MY_SUBMISSIONS} element={<MySubmissions />} />
          <Route path={ROUTES.MY_TRANSACTIONS} element={<MyTransactions />} />
          <Route path={ROUTES.SAVED_LISTINGS} element={<SavedListings />} />
          <Route path={ROUTES.MY_VISITS} element={<MyVisits />} />
        </Route>
      </Route>

      {/* Broker Pages wrapped in DashboardLayout */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.BROKER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.BROKER_DASHBOARD} element={<BrokerDashboard />} />
          <Route path={ROUTES.ADD_PROPERTY} element={<AddProperty />} />
          <Route path={ROUTES.MANAGED_PROPERTIES} element={<ManagedProperties />} /> {/* NEW ROUTE */}
          <Route path="/properties/:id/edit" element={ <EditProperty /> } />
          <Route path={ROUTES.OWNER_SUBMISSIONS} element={<OwnerSubmissions />} />
          <Route path="/pipeline" element={<DealPipeline />} />
          <Route path="/broker/analytics" element={<BrokerAnalytics />} />
          <Route path={ROUTES.BROKER_VISIT_REQUESTS} element={<BrokerVisitRequests />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;