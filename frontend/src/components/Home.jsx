import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useDataContext } from "../context/DataContext";
import Loader from "./Loader/Loader";
import { useSocketContext } from "../context/SocketContext";
import { formatTimeFromNumber, truncateText } from "../utils";
import DialogPopup from "./Dialog";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const Home = () => {
  const location = useLocation();
  const token = Cookies.get("authToken");
  const spot = JSON.parse(localStorage.getItem("spot"));
  const { socket } = useSocketContext();
  const [accountSettings, setAccountSettings] = useState(null);
  const [chosenWorkshop] = useState(
    JSON.parse(localStorage.getItem("workshop")) || null
  );
  const [chosenSpot] = useState(
    JSON.parse(localStorage.getItem("spot")) || null
  );

  const {
    data,
    toggleDialog,
    masterOrderInfo,
    masterBarInfo,
    isOpen,
    orders,
    setOrders,
    setProduct,
    setOrder,
  } = useDataContext();

  const queryParams = new URLSearchParams(location.search);
  const haveToken = queryParams.get("token");

  useEffect(() => {
    if (haveToken) {
      Cookies.set("authToken", haveToken);
    }
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      let accountSettings = JSON.parse(localStorage.getItem("accountSettings"));
      if (!accountSettings) {
        try {
          const resultToken = await axios.get(
            `${import.meta.env.VITE_BACKEND}/checkToken?token=${token}`
          );
          accountSettings = resultToken.data.response;
          localStorage.setItem(
            "accountSettings",
            JSON.stringify(accountSettings)
          );
        } catch (error) {
          console.error("Error fetching token:", error);
        }
      }

      // Set a state variable to indicate accountSettings is ready
      setAccountSettings(accountSettings);
    };

    checkToken();
  }, [token, haveToken]);

  useEffect(() => {
    const createOrder = (data) => {
      if (data.from !== "client" && data.spotId == spot.spot_id) {
        console.log("Received order data:", data.order);
        toast.success(
          `Новый заказ № ${data.order.orderInformation.id.toString().slice(-2)}`
        );

        // Since data.order is a single object, we check the spotId directly
        if (data.order.accountData.spotId == chosenSpot.spot_id) {
          let filterWorkshop = data.order;

          // Filter transactions based on the chosen workshop if applicable
          if (chosenWorkshop) {
            const filteredTransactions = data.order.transaction.filter(
              (transaction) => {
                return transaction.workshop_id == chosenWorkshop.workshop_id;
              }
            );

            // Update the order to only include the filtered transactions
            filterWorkshop = {
              ...data.order,
              transaction: filteredTransactions,
            };
          }

          // Add the new order to the existing orders
          setOrders((prevOrders) => [...prevOrders, filterWorkshop]);
        }
      }
    };

    const changingOrder = (data) => {
      if (data.from !== "client" && data.spotId == spot.spot_id) {
        console.log("Received changing order data:", data.order);

        toast.success(
          ` Офицант изменил заказ № ${data.order.orderInformation.id
            .toString()
            .slice(-2)}`
        );
        // Since data.order is a single object, check the spotId directly
        if (data.order.accountData.spotId == chosenSpot.spot_id) {
          let filterWorkshop = data.order;

          // Filter transactions based on the chosen workshop if applicable
          if (chosenWorkshop) {
            const filteredTransactions = data.order.transaction.filter(
              (transaction) => {
                return transaction.workshop_id == chosenWorkshop.workshop_id;
              }
            );

            // Update the order to only include the filtered transactions
            filterWorkshop = {
              ...data.order,
              transaction: filteredTransactions,
            };
          }

          // Update the order in the state by matching the orderId
          setOrders((prevOrders) =>
            prevOrders.map(
              (order) =>
                order.orderId === data.order.orderId
                  ? { ...order, ...filterWorkshop } // Update the order with new data
                  : order // Keep the same order if the ID does not match
            )
          );
        }
      }
    };

    socket?.on("createOrder", createOrder);
    socket?.on("changeOrderDetails", changingOrder);

    return () => {
      socket?.off("createOrder", createOrder);
      socket?.off("changeOrderDetails", changingOrder);
    };
  }, [socket]);

  const closeTransaction = async (orderId, order) => {
    try {
      if (chosenWorkshop == null) {
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
        );
        console.log("baaack", response.data);

        // Update state to remove the closed order
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.orderId !== orderId)
        );

        socket.emit("frontData", {
          ...order,
          item: "all",
        });
      } else {
        // Make a PUT request to delete the workshop from the transaction array
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`,
          {
            workshopId: chosenWorkshop.workshop_id, // Use the correct property name for workshop ID
          }
        );
        console.log("baaack", response.data);

        // Update state to reflect the deleted workshop in the transaction array
        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            if (order.orderId === orderId) {
              // Remove the workshop from the transaction array
              return {
                ...order,
                transaction: order.transaction.filter(
                  (transaction) =>
                    transaction.workshop_id !== chosenWorkshop.workshop_id
                ),
              };
            }
            return order;
          })
        );

        socket.emit("frontData", {
          ...order,
          item: order.transaction[0],
        });
        console.log("loooog", response.data);

        if (response.data.transaction.length == 0) {
          const response = await axios.delete(
            `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
          );
          console.log(response.data);

          // Update state to remove the closed order
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orderId !== orderId)
          );
        }
      }
    } catch (error) {
      console.error("Error closing transaction", error);
    }
  };


  if (!data) {
    return <Loader />;
  }
  if (orders.length == 0 || !localStorage.getItem("spot")) {
    return (
      <main className=" h-[calc(100vh-48px)] flex items-center justify-center text-white text-2xl">
        <p>Нет заказов</p>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-48px)]">
      {isOpen && <DialogPopup />}

      <section className="w-11/12 py-8 mx-auto grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 place-items-start">
        {orders.map((order) => {
          const nameWaiter = data.find(
            (item) => item?.user_id == order.orderInformation?.userId
          );
          function find(order) {
            if (chosenWorkshop) {
              return order.transaction[0].commentItems.length == 0
                ? false
                : true;
            } else {
              return true;
            }
          }
          return (
            order.transaction.length > 0 &&
            find(order) && (
              <article
                key={order._id}
                className="bg-white/80 rounded-md p-4 pt-2 space-y-4 w-full"
              >
                <div className="flex justify-between items-center font-semibold">
                  <p className="text-2xl">
                    № {order.orderInformation.id.toString().slice(-2)}
                  </p>
                  <span className="text-base text-gray-600 flex flex-col items-end">
                    <p>{nameWaiter && nameWaiter.name}</p>
                    <p>Стол {order.orderInformation.tableId}</p>
                  </span>
                </div>
                <section className="space-y-4">
                  {order.transaction &&
                    order.transaction.some(
                      (orderItem) => orderItem?.commentItems?.length > 0
                    ) &&
                    order.transaction
                      .filter(
                        (orderItem) => orderItem?.commentItems?.length > 0
                      )
                      .map((orderItem, orderItemIndex) =>
                        orderItem?.commentItems?.map((product, index) => (
                          <article
                            key={`${orderItemIndex}-${index}`}
                            className="bg-white rounded-md shadow-md flex flex-col py-1 justify-center overflow-hidden"
                          >
                            <div
                              className="flex gap-3 p-3 justify-between"
                              onClick={async () => {
                                masterOrderInfo(product);
                                masterBarInfo(orderItem);
                                toggleDialog();
                                setOrder(order);
                                setProduct(product);
                              }}
                            >
                              <p className="font-semibold text-xl">
                                {product.count}
                              </p>
                              <div className="flex justify-between items-start gap-5 w-3/4">
                                <span className="space-y-2">
                                  <p className="font-semibold text-lg">
                                    {product?.product_name}
                                  </p>
                                  <p className="text-gray-600">
                                    {truncateText(orderItem?.comment, 5)}
                                  </p>
                                </span>
                                <p className="text-gray-600 font-semibold">
                                  {formatTimeFromNumber(
                                    order.orderInformation.dateStart
                                  )}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                  <button
                    key={order.orderId}
                    className="bg-green-500 text-white w-full py-2 mt-3 rounded-md text-lg"
                    onClick={() => {
                      closeTransaction(order.orderId, order);
                    }}
                  >
                    Закрыть чек
                  </button>
                </section>
              </article>
            )
          );
        })}
      </section>
    </main>
  );
};

export default Home;
