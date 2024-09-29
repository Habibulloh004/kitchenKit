import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";

export const DataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDataContext = () => {
  return useContext(DataContext);
};

// eslint-disable-next-line react/prop-types
export const DataContextProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
  const [order, setOrder] = useState({});
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState({
    orderId: 0,
    productId: 0,
    loading: false,
  });
  const [data, setData] = useState([]);
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
  async function getOrders() {
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

        // filterWorkshop.map((order) => {
        //   // Filter the transactions for each order
        //   order.transaction = order.transaction.map((workshops) => {
        //     // Filter commentItems to exclude finished products
        //     workshops.commentItems = workshops.commentItems.filter(
        //       (product) => {
        //         return product.status !== "finished"; // Return the result of the condition
        //       }
        //     );

        //     return workshops; // Return the modified workshops with filtered commentItems
        //   });

        //   return order; // Return the modified order with updated transactions
        // });

        setOrders(filterWorkshop);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }
  }

  async function fetchData() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND}/getWaiters?token=${token}`
      );

      const backData = response.data; // Access the data from the response
      setData(backData);
      return data; // If you need to return the data from this function
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    Promise.all([getOrders(), fetchData()]);
  }, [accountSettings]); // Updated dependencies

  useEffect(() => {
    // Handler for when the browser goes offline
    const handleOffline = () => {
      setIsOnline(false);
      toast.error(
        "Вы не в сети. Пожалуйста, проверьте подключение к Интернету"
      );
    };

    // Handler for when the browser comes online
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Вы снова в сети)");
      Promise.all([getOrders(), fetchData()]);
    };

    // Adding event listeners for online and offline events
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <DataContext.Provider
      value={{
        isOnline,
        setIsOnline,
        order,
        setOrder,
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
        getOrders
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
