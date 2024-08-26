import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useDataContext } from "../context/DataContext";
import Loader from "./Loader/Loader";
import { useSocketContext } from "../context/SocketContext";
import { formatTimeFromNumber, truncateText } from "../utils";
import DialogPopup from "./Dialog";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const token = Cookies.get("authToken");
  const spot = JSON.parse(localStorage.getItem("spot"));
  const { socket } = useSocketContext();
  const [accountSettings, setAccountSettings] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    orderId: 0,
    productId: 0,
    loading: false,
  });
  const { data, toggleDialog, masterOrderInfo, masterBarInfo, isOpen } =
    useDataContext();

  // const queryParams = new URLSearchParams(location.search);
  // const haveToken = queryParams.get("token");

  // useEffect(() => {
  //   if (haveToken) {
  //     Cookies.set("authToken", haveToken);
  //     navigate("/");
  //   }
  // }, []);

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
  }, []);

  useEffect(() => {
    const getOrders = async () => {
      if (accountSettings) {
        try {
          const result = await axios.post(
            `${import.meta.env.VITE_BACKEND}/getOrders`,
            {
              accountUrl: accountSettings.COMPANY_ID,
            }
          );
          setOrders(result.data);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      }
    };

    getOrders();
  }, [accountSettings]);

  useEffect(() => {
    const createOrder = (data) => {
      if (data.from !== "client" && data.spotId == spot.spot_id) {
        console.log(data);
        toast.success(
          `Новый заказ № ${data.order.orderInformation.id.toString().slice(-2)}`
        );

        // Update the order in the state
        setOrders((prevOrders) => [...prevOrders, data.order]);
      }
    };
    const changingOrder = (data) => {
      if (data.from !== "client" && data.spotId == spot.spot_id) {
        console.log(data);
        toast.success(
          `Офицант изменил заказ № ${data.order.orderInformation.id
            .toString()
            .slice(-2)}`
        );

        // Update the order in the state
        setOrders((prevOrders) =>
          prevOrders.map(
            (order) =>
              order.orderId == data.order.orderId
                ? { ...order, ...data.order } // Replace with new data
                : order // Keep the same if ID does not match
          )
        );
      }
    };

    socket?.on("createOrder", createOrder);
    socket?.on("changeOrderDetails", changingOrder);

    return () => {
      socket?.off("createOrder", createOrder);
      socket?.off("changeOrderDetails", changingOrder);
    };
  }, [socket]);

  const changeStatus = async (orderId, item, status) => {
    try {
      const productChangeStatus = await axios.put(
        `${import.meta.env.VITE_BACKEND}/changeOrderStatus/${orderId}`,
        { item }
      );

      const updatedTransactions = productChangeStatus.data.transaction;

      if (!updatedTransactions || !Array.isArray(updatedTransactions)) {
        throw new Error("Invalid response from the server.");
      }

      setOrders((prevOrders) => {
        return prevOrders.map((order) => {
          if (order.orderId === productChangeStatus.data.orderId) {
            return {
              ...order,
              transaction: order.transaction.map((transaction) => {
                const updatedTransaction = updatedTransactions.find(
                  (updatedTran) =>
                    updatedTran.workshop_id === transaction.workshop_id
                );

                if (!updatedTransaction) {
                  return transaction;
                }

                return {
                  ...transaction,
                  commentItems: transaction.commentItems
                    .map((commentItem) => {
                      const updatedItem = updatedTransaction.commentItems.find(
                        (updatedItem) =>
                          updatedItem.product_id === commentItem.product_id
                      );
                      if (updatedItem) {
                        return { ...commentItem, status: updatedItem.status };
                      }
                      return commentItem;
                    })
                    .filter((commentItem) =>
                      updatedTransaction.commentItems.some(
                        (updatedItem) =>
                          updatedItem.product_id === commentItem.product_id
                      )
                    ),
                };
              }),
            };
          }
          return order;
        });
      });

      socket.emit("frontData", {
        ...productChangeStatus.data,
        status,
      });

      // Set loading state to false after updating orders
      setLoading({
        orderId: 0,
        productId: 0,
        loading: false,
      });

      console.log("backdata", productChangeStatus.data);
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const closeTransaction = async (orderId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
      );
      console.log(response.data);

      // Update state to remove the closed order
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.orderId != orderId)
      );
    } catch (error) {
      console.error("Error closing transaction", error);
    }
  };

  if (!data) {
    return <Loader />;
  }
  if (orders.length == 0) {
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
            (item) => item.user_id == order.orderInformation.userId
          );
          return (
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
                  (order.transaction.some(
                    (orderItem) => orderItem?.commentItems?.length > 0
                  ) ? (
                    order.transaction
                      .filter(
                        (orderItem) => orderItem?.commentItems?.length > 0
                      )
                      .map((orderItem, orderItemIndex) =>
                        orderItem?.commentItems?.map((product, index) => (
                          <article
                            key={`${orderItemIndex}-${index}`}
                            className="bg-white rounded-md shadow-md flex flex-col justify-between overflow-hidden"
                          >
                            <div
                              className="flex gap-3 p-3 justify-between"
                              onClick={async () => {
                                masterOrderInfo(product);
                                masterBarInfo(orderItem);
                                toggleDialog();
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
                            <button
                              disabled={
                                product.product_id === loading.productId &&
                                loading.loading &&
                                order._id === loading.orderId
                              }
                              onClick={() => {
                                changeStatus(
                                  order.orderId,
                                  product,
                                  product.status
                                );
                                setLoading({
                                  orderId: order._id,
                                  productId: product.product_id,
                                  loading: true,
                                });
                              }}
                              className={`${
                                product.status === "cooking"
                                  ? "bg-green-600"
                                  : "bg-yellow-500"
                              } ${
                                product.product_id === loading.productId &&
                                loading.loading &&
                                order._id === loading.orderId &&
                                "bg-opacity-50"
                              } text-white py-3 text-lg`}
                            >
                              {product.product_id === loading.productId &&
                              loading.loading &&
                              order._id === loading.orderId
                                ? "Loading"
                                : product.status === "cooking"
                                ? "Готово"
                                : "Начать"}
                            </button>
                          </article>
                        ))
                      )
                  ) : (
                    <button
                      key={order.orderId}
                      className="bg-green-500 text-white w-full py-2 mt-3 rounded-md text-lg"
                      onClick={() => {
                        console.log(order.orderId);
                        closeTransaction(order.orderId);
                      }}
                    >
                      Закрыть чек
                    </button>
                  ))}
              </section>
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default Home;
