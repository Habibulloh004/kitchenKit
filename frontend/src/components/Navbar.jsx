import { Link } from "react-router-dom";
import { navbarItems } from "../utils";
import { useEffect, useState } from "react";
import Spots from "./Spots";
// import toast from "react-hot-toast";
// import Cookies from "js-cookie";
import Workshops from "./Workshops";
import { useDataContext } from "../context/DataContext";

const Navbar = () => {
  const [navIndex, setNavIndex] = useState(1);
  const [time, setTime] = useState(new Date());
  const { isOnline } = useDataContext();

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
        <div></div>
        <div className="flex items-center gap-4 md:gap-10">
          {/* <p
            onClick={() => {
              toast(
                (t) => (
                  <span className="flex gap-3">
                    Связаться с нами <br />
                    {`+998(93) 520-40-50 Хабибуллох`}
                    <div className="flex items-end gap-3">
                      <button
                        className="py-1 px-4 pb-2 rounded-md border border-gray-500"
                        onClick={() => toast.dismiss(t.id)}
                      >
                        Отмена
                      </button>
                    </div>
                  </span>
                ),
                {
                  duration: 10000,
                  icon: "☎",
                }
              );
            }}
            className="inline-flex items-center gap-2 rounded-md bg-blue-500/50 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white"
          >
            Тех. поддержка
          </p> */}
          <Workshops />
          <Spots />
          {/* <p
            onClick={() => {
              toast(
                (t) => (
                  <span className="flex gap-3">
                    Вы уверены, что хотите выйти из своей учетной записи?
                    <div className="flex items-end gap-3">
                      <button
                        className="py-1 px-4 pb-2 rounded-md text-white bg-red-500"
                        onClick={() => {
                          toast.dismiss(t.id);
                          Cookies.remove("authToken");
                          localStorage.clear();
                          // location.pathname = `https://joinposter.com/api/auth?application_id=3629&redirect_uri=${
                          //   import.meta.env.VITE_BACKEND
                          // }/auth&response_type=code`;
                          window.location.href = `https://joinposter.com/api/auth?application_id=3629&redirect_uri=${
                            import.meta.env.VITE_BACKEND
                          }/auth&response_type=code`;
                          // navigate("/")
                        }}
                      >
                        да
                      </button>
                      <button
                        className="py-1 px-4 pb-2 rounded-md border border-gray-500"
                        onClick={() => toast.dismiss(t.id)}
                      >
                        нет
                      </button>
                    </div>
                  </span>
                ),
                {
                  duration: 10000,
                  icon: "❓",
                  style: {
                    minWidth: "500px",
                  },
                }
              );
            }}
            className="inline-flex items-center gap-2 rounded-md bg-red-500 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white"
          >
            Выйти
          </p> */}
          <div>
            {isOnline ? (
              <div className="bg-green-500 w-[10px] h-[10px] rounded-full"></div>
            ) : (
              <div className="bg-red-500 w-[10px] h-[10px] rounded-full"></div>
            )}
          </div>
          <p className="text-3xl mr-5 font-semibold">{formatTime(time)}</p>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
