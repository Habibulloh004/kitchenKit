import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";

const Workshops = () => {
  const location = useLocation();
  const token = Cookies.get("authToken");
  const [workshops, setWorkshops] = useState([]);
  const [chosenWorkshop, setChosenWorkshop] = useState(
    JSON.parse(localStorage.getItem("workshop")) || null
  );

  const queryParams = new URLSearchParams(location.search);
  const haveToken = queryParams.get("token");

  useEffect(() => {
    if (haveToken) {
      Cookies.set("authToken", haveToken);
    }
  }, []);

  useEffect(() => {
    const getWorkshops = async () => {
      if (token || haveToken) {
        try {
          const result = await axios.get(
            `${import.meta.env.VITE_BACKEND}/getWorkshops?token=${
              token ? token : haveToken
            }`
          );
          setWorkshops(result.data);
        } catch (error) {
          console.error("Error fetching spots:", error);
        }
      } else {
        console.log("No token available.");
      }
    };
    getWorkshops();
  }, [token]);

  return (
    <div className="text-right">
      {!workshops.length ? null : (
        <Menu>
          <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-800 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
            {chosenWorkshop && chosenWorkshop.length > 0 ? `Цех: ${chosenWorkshop.length}` : "Цех: Все"}
          </MenuButton>
          <MenuItems
            transition
            anchor="bottom end"
            className="w-52 mt-3 origin-top-right rounded-xl border border-white/5 bg-black/80 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              <button
                onClick={() => {
                  localStorage.setItem("workshop", "[]");
                  setChosenWorkshop([]);
                  window.location.reload();
                }}
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
              >
                {!chosenWorkshop || chosenWorkshop.length == 0 && <FaCheck />} Все
              </button>
            </MenuItem>
            {workshops.map((item) => {
              return (
                <MenuItem key={item.workshop_id}>
                  <button
                    onClick={() => {
                      const storedWorkshop =
                        JSON.parse(localStorage.getItem("workshop")) || [];
                      let workshopArray = [...storedWorkshop];

                      const itemExists = workshopArray.find(
                        (workshop) => workshop.workshop_id === item.workshop_id
                      );

                      if (itemExists) {
                        workshopArray = workshopArray.filter(
                          (workshop) =>
                            workshop.workshop_id !== item.workshop_id
                        );
                      } else {
                        workshopArray.push(item);
                      }

                      // Update localStorage and set state separately
                      localStorage.setItem(
                        "workshop",
                        JSON.stringify(workshopArray)
                      );
                      setChosenWorkshop(workshopArray);
                      window.location.reload();
                    }}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    {chosenWorkshop && chosenWorkshop.length && chosenWorkshop?.find(
                      (workshop) => workshop.workshop_id == item.workshop_id
                    ) ? (
                      <>
                        <FaCheck />{" "}
                        {item.workshop_name}
                      </>
                    ) : (
                      item.workshop_name
                    )}
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

export default Workshops;
