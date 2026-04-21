import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../utils/constants';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const location = useLocation();

    // 1. Not logged in? Send to login page [cite: 277]
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // 2. Logged in, but wrong role? (e.g., Customer trying to access Broker dashboard)
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to their appropriate dashboard based on role [cite: 274-276]
        const redirectPath = user?.role === 'BROKER' 
            ? ROUTES.BROKER_DASHBOARD 
            : ROUTES.CUSTOMER_DASHBOARD;
        
        return <Navigate to={redirectPath} replace />;
    }

    // 3. Authorized! Render the child routes
    return <Outlet />;
};

export default ProtectedRoute;