import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  lazy,
  Suspense,
  useLayoutEffect,
} from "react";
import Loader from "./components/Loader/Loader";
import Cookies from "js-cookie";
// import Order from "./components/Order";
// import Home from "./components/Home";
// import History from "./components/History";
import Navbar from "./components/Navbar";
const Home = lazy(() => import("./components/Home"));
const Order = lazy(() => import("./components/Order"));
const History = lazy(() => import("./components/History"));

export const TokenContext = createContext(null);

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ element }) => {
  // const [token] = useContext(TokenContext);
  return element
    // : (window.location.href =
    //     "https://joinposter.com/api/auth?application_id=3544&redirect_uri=https://kitchenkit.onrender.com/auth&response_type=code");
};
function App() {
  const [screenSize, setScreenSize] = useState(600);
  const [token, setToken] = useState(Cookies.get("authToken"));
  
  useEffect(() => {
    const currentTime = new Date().getTime();
    const sixMonthsInMilliseconds = 6 * 30 * 24 * 60 * 60 * 1000;
    const savedTime = localStorage.getItem("savedTime");

    if (savedTime) {
      const elapsedTime = currentTime - parseInt(savedTime, 10);
      if (elapsedTime > sixMonthsInMilliseconds) {
        Cookies.remove("authToken");
        localStorage.removeItem("accountSettings");
        localStorage.setItem("savedTime", currentTime.toString());
      }
    } else {
      localStorage.setItem("savedTime", currentTime.toString());
    }
  }, []);

  function resizeHandler() {
    setScreenSize(window.innerWidth);
  }

  useLayoutEffect(() => {
    setScreenSize(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <>
      {screenSize < 500 ? (
        <>
          <main className="w-9/12 mx-auto h-screen flex justify-center items-center flex-col text-center gap-5">
            <h1 className="text-3xl font-semibold">Hey! 👋</h1>
            <p className="text-secondary-gray text-base">
              This task is designed for a screen width of{" "}
              <span className="text-blue-500">500px or greater</span>. Please
              focus your evaluation and testing on this resolution. The
              assessment of mobile or smaller screen designs is not required at
              this stage, and we encourage you to concentrate on the larger
              screen format.
            </p>
            <p className="text-lg font-semibold">Thank you and good luck! 🍀</p>
          </main>
        </>
      ) : (
        <>
          <Toaster position="top-center" reverseOrder={false} />

          <TokenContext.Provider value={[token, setToken]}>
            <Navbar />
            <div className="pt-[48px]">
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route
                    path="/"
                    element={<ProtectedRoute element={<Home />} />}
                  />
                  <Route
                    path="/:id"
                    element={<ProtectedRoute element={<Order />} />}
                  />
                  <Route
                    path="/history"
                    element={<ProtectedRoute element={<History />} />}
                  />
                </Routes>
              </Suspense>
              <Toaster position="top-center" reverseOrder={false} />
            </div>
          </TokenContext.Provider>
        </>
      )}
    </>
  );
}

export default App;
