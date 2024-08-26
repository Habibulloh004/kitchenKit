import { useAuth } from "./AuthContext";

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ element }) => {
  const { user } = useAuth();

  if (user === null) {
    // Optional: Add a loading state here to prevent flicker
    return null;
  }

  return user
    ? element
    : (window.location.href =
        "https://joinposter.com/api/auth?application_id=3544&redirect_uri=https://kitchenkit.onrender.com/auth&response_type=code");
};

export default ProtectedRoute;
