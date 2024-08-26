import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";

export const DataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDataContext = () => {
  return useContext(DataContext);
};

// eslint-disable-next-line react/prop-types
export const DataContextProvider = ({ children }) => {
  const token = Cookies.get("authToken");
  const [isOpen, setIsOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState({});
  const [barInfo, setBarInfo] = useState({});
  const accountData = JSON.parse(localStorage.getItem("accountSettings"));

  const toggleDialog = () => {
    setIsOpen((prev) => !prev);
  };

  const masterOrderInfo = (data) => {
    setOrderInfo(data);
  };
  const masterBarInfo = (data) => {
    setBarInfo(data);
  };

  const { data } = useQuery({
    queryKey: ["getWaiters"],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND}/getWaiters?token=${token}`)
        .then((res) => res.json())
        .then((res) => res.response),
  });

  return (
    <DataContext.Provider
      value={{
        data,
        isOpen,
        toggleDialog,
        orderInfo,
        masterOrderInfo,
        barInfo,
        masterBarInfo,
        accountData,
        token
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
