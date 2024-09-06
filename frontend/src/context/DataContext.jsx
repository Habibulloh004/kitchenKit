import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

export const DataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDataContext = () => {
  return useContext(DataContext);
};

// eslint-disable-next-line react/prop-types
export const DataContextProvider = ({ children }) => {
  const [chosenWorkshop] = useState(
    JSON.parse(localStorage.getItem("workshop")) || null
  );
  const [chosenSpot] = useState(
    JSON.parse(localStorage.getItem("spot")) || null
  );
  const [accountSettings] = useState(
    JSON.parse(localStorage.getItem("accountSettings")) || null
  );
  const token = Cookies.get("authToken");
  const [isOpen, setIsOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState({});
  const [barInfo, setBarInfo] = useState({});
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState({})
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState({
    orderId: 0,
    productId: 0,
    loading: false,
  });
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

  useEffect(() => {
    const getOrders = async () => {
      if (accountSettings && chosenSpot) {
        try {
          const result = await axios.post(
            `${import.meta.env.VITE_BACKEND}/getOrders`,
            {
              accountUrl: accountSettings.COMPANY_ID,
            }
          );

          // Filter orders based on the chosen spot ID
          let filteredOrders = result.data.filter(
            (item) => item.accountData.spotId == chosenSpot.spot_id
          );

          let filterWorkshop = filteredOrders;

          if (chosenWorkshop) {
            filterWorkshop = filteredOrders.map((order) => {
              const filteredTransactions = order.transaction.filter(
                (transaction) => {
                  return transaction.workshop_id == chosenWorkshop.workshop_id;
                }
              );

              return {
                ...order,
                transaction: filteredTransactions,
              };
            });
          }

          setOrders(filterWorkshop);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      }
    };

    getOrders();
  }, [accountSettings, chosenSpot, chosenWorkshop]); // Updated dependencies

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
        order, setOrder,
        product,
        setProduct,
        data,
        isOpen,
        toggleDialog,
        orderInfo,
        masterOrderInfo,
        barInfo,
        masterBarInfo,
        accountData,
        token,
        loading,
        setLoading,
        orders,
        setOrders,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
