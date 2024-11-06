import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";

const Spots = () => {
  const location = useLocation();
  const token = Cookies.get("authToken");
  const [spots, setSpots] = useState([]);
  const [chosenSpot, setChosenSpot] = useState(
    JSON.parse(localStorage.getItem("spot")) || null
  );

  const queryParams = new URLSearchParams(location.search);
  const haveToken = queryParams.get("token");

  useEffect(() => {
    if (haveToken) {
      Cookies.set("authToken", haveToken);
    }
  }, []);

  useEffect(() => {
    const getSpots = async () => {
      if (token || haveToken) {
        try {
          const result = await axios.get(
            `${import.meta.env.VITE_BACKEND}/getSpots?token=${
              token ? token : haveToken
            }`
          );
          setSpots(result.data);
        } catch (error) {
          console.error("Error fetching spots:", error);
        }
      } else {
        console.log("No token available.");
      }
    };
    getSpots();
  }, [token]);

  return (
    <div className="text-right">
      {!spots.length ? null : (
        <Menu>
          <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-800 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
            {chosenSpot
              ? `Филиал: ${chosenSpot.name}`
              : "Пожалуйста, выберите филиал! Филиалы 👇"}
          </MenuButton>
          <MenuItems
            transition
            anchor="bottom end"
            className="w-52 mt-3 origin-top-right rounded-xl border border-white/5 bg-black/80 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {spots.map((item) => {
              return (
                <MenuItem key={item.spot_id}>
                  <button
                    onClick={() => {
                      localStorage.setItem("spot", JSON.stringify(item));
                      setChosenSpot(item);
                      window.location.reload();
                    }}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    {chosenSpot && item.spot_id == chosenSpot.spot_id && <FaCheck />}{" "}{item.name}
                  </button>
                </MenuItem>
              );
            })}
          </MenuItems>
        </Menu>
      )}
    </div>
  );
};

export default Spots;
