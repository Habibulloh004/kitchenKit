import { Link } from "react-router-dom";
import { navbarItems } from "../utils";
import { useEffect, useState } from "react";
import Spots from "./Spots";

const Navbar = () => {
  const [navIndex, setNavIndex] = useState(1);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 60000); // Update every minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? "0" + minutes : minutes; // Add leading zero to minutes if needed
    return `${hours}:${minutes}`;
  };
  return (
    <header className="bg-blue-600 fixed top-0 w-full z-50">
      <nav className="flex justify-between items-center text-white h-12">
        <ul className="flex items-center space-x-4">
          {navbarItems.map((item) => (
            <li key={item.id}>
              <Link
                className={`px-5 py-2 text-xl ${
                  item.id === navIndex
                    ? "text-white border-b-2 border-blue-200 font-semibold"
                    : "text-gray-300"
                }`}
                to={item.path}
                onClick={() => setNavIndex(item.id)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-10">
          <button
            onClick={() => {
              window.location.href =
                "https://joinposter.com/api/auth?application_id=3544&redirect_uri=https://kitchenkit.onrender.com/auth&response_type=code";
            }}
          >
            Auth
          </button>
          <Spots />
          <p className="text-3xl mr-5 font-semibold">{formatTime(time)}</p>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
