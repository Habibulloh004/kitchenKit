import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const Spots = () => {
  const token = Cookies.get("authToken");
  const [spots, setSpots] = useState([]);
  const [chosenSpot, setChosenSpot] = useState(
    JSON.parse(localStorage.getItem("spot")) || []
  );
  useEffect(() => {
    const getOrders = async () => {
      if (token) {
        try {
          const result = await axios.get(
            `${import.meta.env.VITE_BACKEND}/getSpots?token=${token}`
          );
          setSpots(result.data);
        } catch (error) {
          console.error("Error fetching spots:", error);
        }
      } else {
        console.log("No token available.");
      }
    };
    getOrders();
  }, [token]);

  if(!spots.length) {
    return <>nothing</>
  }

  return (
    <div className=" text-right">
      {!spots.length ? null : (
        <Menu>
          <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-800 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
            {chosenSpot ? `Филиал: ${chosenSpot.name}` : "Пожалуйста, выберите филиал! Филиалы 👇"}
          </MenuButton>
          {spots.length > 0 && spots?.map((item) => {
            return (
              <MenuItems
                key={item.spot_id}
                transition
                anchor="bottom end"
                className="w-52 mt-3 origin-top-right rounded-xl border border-white/5 bg-black/80 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <MenuItem>
                  <button
                    onClick={() => {
                      localStorage.setItem("spot", JSON.stringify(item));
                      setChosenSpot(item);
                    }}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    {item.name}
                  </button>
                </MenuItem>
              </MenuItems>
            );
          })}
        </Menu>
      )}
    </div>
  );
};

export default Spots;
