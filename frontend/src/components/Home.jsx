/* eslint-disable react/prop-types */
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
import notice from "../../public/notice.mp3";

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
      if (data.from == "poster" && data.spotId == spot.spot_id) {
        const sound = new Audio(notice);
        sound.play();
        toast.success(
          `Новый заказ № ${data.order.orderInformation.id.toString().slice(-4)}`
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
      if (data.from == "poster" && data.spotId == spot.spot_id) {
        const sound = new Audio(notice);
        sound.play();
        toast.success(
          ` Офицант изменил заказ № ${data.order.orderInformation.id
            .toString()
            .slice(-4)}`
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

    const changeAllOrder = (data) => {
      if (
        data.from === "backend" &&
        data.data.accountData.spotId === spot.spot_id
      ) {
        let updatedOrder = data.data;
        const { orderId } = data.data;
        console.log(data);
    
        // Filter transactions based on the chosen workshop if applicable
        if (chosenWorkshop) {
          const filteredTransactions = updatedOrder.transaction.filter(
            (transaction) => transaction.workshop_id === chosenWorkshop.workshop_id
          );
    
          // Update the order to only include the filtered transactions
          updatedOrder = {
            ...updatedOrder,
            transaction: filteredTransactions,
          };
        }
    
        // Remove the order if the `item` is "all"
        if (updatedOrder.item === "all") {
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orderId !== orderId)
          );
        } else {
          // Update the order in the state by matching the orderId
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.orderId === orderId ? { ...updatedOrder } : order
            )
          );
        }
      }
    };
    
    socket?.on("changeOrder", changeAllOrder);
    socket?.on("deleteOrder", changeAllOrder);
    socket?.on("deleteAllOrder", changeAllOrder);

    socket?.on("createOrder", createOrder);
    socket?.on("changeOrderDetails", changingOrder);

    return () => {
      socket?.off("createOrder", createOrder);
      socket?.off("changeOrderDetails", changingOrder);
      socket?.off("changeOrder", changeAllOrder);
      socket?.off("deleteOrder", changeAllOrder);
      socket?.off("deleteAllOrder", changeAllOrder);
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

  console.log(orders);

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

      <section className="w-11/12 py-8 mx-auto grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 place-items-start">
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
                    № {order.orderInformation.id.toString().slice(-4)}
                  </p>
                  <span className="text-base text-gray-600 flex flex-col items-end">
                    <p>{nameWaiter && nameWaiter.name}</p>
                    <p>Стол {order.orderInformation.tableName.table_num}</p>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-600">
                    {truncateText(order?.orderInformation.comment)}
                  </p>
                  <p className="text-gray-600">
                    {formatTimeFromNumber(order?.orderInformation.dateStart)}
                  </p>
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
                        orderItem?.commentItems?.map((product, index) => {
                          return (
                            <ProductTimer
                              key={`${orderItemIndex}-${index}`}
                              product={product}
                              orderTime={order.orderInformation.dateStart}
                              onClickHandler={() => {
                                masterOrderInfo(product);
                                masterBarInfo(orderItem);
                                toggleDialog();
                                setOrder(order);
                                setProduct(product);
                              }}
                            />
                          );
                        })
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

function ProductTimer({ product, orderTime, onClickHandler }) {
  const [remainingTime, setRemainingTime] = useState(product.cooking_time); // Initialize with cooking time in seconds
  const [backgroundColor, setBackgroundColor] = useState("bg-white text-black"); // Default background color

  useEffect(() => {
    if (product.cooking_time == 0 || product.cooking_time == undefined) {
      setBackgroundColor("bg-white text-black");
      setRemainingTime(0);
      return;
    }

    // Ensure orderTime is correctly interpreted as a Unix timestamp in milliseconds
    const createdTime = new Date(orderTime); // orderTime is already in milliseconds
    if (isNaN(createdTime.getTime())) {
      console.error("Invalid orderTime:", orderTime);
      setRemainingTime(0);
      return;
    }

    const currentTime = Date.now(); // Current time in milliseconds
    const elapsedTime = Math.floor(
      (currentTime - createdTime.getTime()) / 1000
    ); // Elapsed time in seconds

    setRemainingTime(Math.max(product.cooking_time - elapsedTime, 0));

    const intervalId = setInterval(() => {
      setRemainingTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [orderTime, product.cooking_time]);

  useEffect(() => {
    if (product.cooking_time == 0 || product.cooking_time == undefined) {
      setBackgroundColor("bg-white text-black");
    } else if (remainingTime < 60) {
      setBackgroundColor("bg-red-500 text-white");
    } else if (remainingTime < 180) {
      setBackgroundColor("bg-yellow-500 text-white");
    } else {
      setBackgroundColor("bg-green-500 text-white");
    }
  }, [remainingTime, product.cooking_time]);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <article
      className={`${backgroundColor} rounded-md shadow-md flex flex-col py-1 justify-center overflow-hidden`}
      onClick={onClickHandler}
    >
      <div className="flex gap-3 p-3 justify-between">
        <p className="font-semibold text-xl">{product.count}</p>
        <div className="flex justify-between items-start gap-5 w-3/4">
          <span className="space-y-2">
            <p className="font-semibold text-lg">{product?.product_name} {`${product.modificationName ? `(${product.modificationName})` : "" }`}</p>
          </span>
          <p className="text-gray-800 font-semibold">
            {product.cooking_time && formatTime(remainingTime)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default Home;
