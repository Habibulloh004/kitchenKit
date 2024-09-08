import { Dialog, DialogPanel } from "@headlessui/react";
import { useDataContext } from "../context/DataContext";
import { FaXmark } from "react-icons/fa6";
import { FaTrashAlt, FaRegCheckCircle } from "react-icons/fa";
import Loader from "./Loader/Loader";
import NoImg from "../assets/no-img.png";
import { useSocketContext } from "../context/SocketContext";
import axios from "axios";
import { useState } from "react";
import Cookies from "js-cookie";

const DialogPopup = () => {
  const {
    isOpen,
    toggleDialog,
    orderInfo,
    barInfo,
    loading,
    setLoading,
    product,
    order,
    setOrders,
  } = useDataContext();
  const token = Cookies.get("authToken");
  const isDataLoaded = orderInfo && barInfo;
  const { socket } = useSocketContext();
  const [chosenWorkshop] = useState(
    JSON.parse(localStorage.getItem("workshop")) || null
  );

  // const changeStatus = async (orderId, item, status) => {
  //   console.log("orderId", orderId);
  //   console.log("item", item);
  //   console.log("status", status);
  //   try {
  //     const productChangeStatus = await axios.put(
  //       `${import.meta.env.VITE_BACKEND}/changeOrderStatus/${orderId}`,
  //       { item }
  //     );
  //     const updatedTransactions = productChangeStatus.data.updatedOrder.transaction;
  //     console.log(productChangeStatus.data);
  //     if (!updatedTransactions || !Array.isArray(updatedTransactions)) {
  //       throw new Error("Invalid response from the server.");
  //     }
  //     setOrders((prevOrders) => {
  //       return prevOrders.map((order) => {
  //         if (order.orderId === productChangeStatus.data.orderId) {
  //           return {
  //             ...order,
  //             transaction: order.transaction.map((transaction) => {
  //               const updatedTransaction = updatedTransactions.find(
  //                 (updatedTran) =>
  //                   updatedTran.workshop_id === transaction.workshop_id
  //               );
  //               if (!updatedTransaction) {
  //                 return transaction;
  //               }
  //               return {
  //                 ...transaction,
  //                 commentItems: transaction.commentItems
  //                   .map((commentItem) => {
  //                     const updatedItem = updatedTransaction.commentItems.find(
  //                       (updatedItem) =>
  //                         updatedItem.product_id === commentItem.product_id
  //                     );
  //                     if (updatedItem) {
  //                       return { ...commentItem, status: updatedItem.status };
  //                     }
  //                     return commentItem;
  //                   })
  //                   .filter((commentItem) =>
  //                     updatedTransaction.commentItems.some(
  //                       (updatedItem) =>
  //                         updatedItem.product_id === commentItem.product_id
  //                     )
  //                   ),
  //               };
  //             }),
  //           };
  //         }
  //         return order;
  //       });
  //     });
  //     socket.emit("frontData", {
  //       ...productChangeStatus.data.updatedOrder,
  //       status,
  //     });
  //     // Set loading state to false after updating orders
  //     setLoading({
  //       orderId: 0,
  //       productId: 0,
  //       loading: false,
  //     });
  //     console.log("backdata", productChangeStatus.data);

  //   } catch (error) {
  //     console.error("Error updating status", error);
  //   }
  // };

  const deleteItem = async (orderId, item, status) => {
    try {
      const productChangeStatus = await axios.put(
        `${import.meta.env.VITE_BACKEND}/deleteItem/${orderId}`,
        { item, order, token, status }
      );

      const updatedTransactions =
        productChangeStatus.data.updatedOrderMe.transaction;

      if (!updatedTransactions || !Array.isArray(updatedTransactions)) {
        throw new Error("Invalid response from the server.");
      }

      setOrders((prevOrders) => {
        return prevOrders.map((order) => {
          if (
            order.orderId === productChangeStatus.data.updatedOrderMe.orderId
          ) {
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

      if (status == "finished") {
        socket.emit("frontData", {
          ...productChangeStatus.data.updatedOrderMe,
          item,
          status,
        });
      } else {
        socket.emit("deleteItem", {
          ...productChangeStatus.data.updatedOrderMe,
          item,
          status,
        });
      }

      // Set loading state to false after updating orders
      setLoading({
        orderId: 0,
        productId: 0,
        loading: false,
      });

      console.log("updating", productChangeStatus.data.updatedOrderMe);

      if (chosenWorkshop == null) {
        const checkAllCommentItems = async (order) => {
          // Check if all commentItems arrays are empty
          const allEmpty = order.data.updatedOrderMe.transaction.every(
            (transactionItem) => transactionItem.commentItems.length === 0
          );

          // Output 0 if all are empty, otherwise 1
          console.log(allEmpty ? 0 : 1);
          console.log(allEmpty);
          if (allEmpty) {
            const response = await axios.delete(
              `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
            );
            console.log("baaack", response.data);

            // Update state to remove the closed order
            setOrders((prevOrders) =>
              prevOrders.filter((order) => order.orderId !== orderId)
            );

            socket.emit("frontData", {
              ...order.data.updatedOrderMe,
              item: "all",
            });
          }
        };

        // Calling the function with the sample data
        checkAllCommentItems(productChangeStatus);
      } else {
        const chosenWorkshopId = chosenWorkshop.workshop_id; // Extract workshop_id from chosenWorkshop

        const index =
          productChangeStatus.data.updatedOrderMe.transaction.findIndex(
            (item) => item.workshop_id == chosenWorkshopId
          );
        if (
          productChangeStatus.data.updatedOrderMe.transaction[index]
            .commentItems.length == 0
        ) {
          setOrders((prevOrders) =>
            prevOrders.filter(
              (order) =>
                order.orderId != productChangeStatus.data.updatedOrderMe.orderId
            )
          );
        }
      }

      // if (chosenWorkshop) {
      //   const chosenWorkshopId = chosenWorkshop.workshop_id; // Extract workshop_id from chosenWorkshop

      //   const index =
      //     productChangeStatus.data.updatedOrder.transaction.findIndex(
      //       (item) => item.workshop_id == chosenWorkshopId
      //     );
      //   console.log("indexxxx", index);
      //   console.log("ooooor", order.transaction);

      //   if (order.transaction[index].commentItems.length == 0) {
      //     const response = await axios.delete(
      //       `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
      //     );

      //     console.log("ressss:", response.data);

      //     // Update state to remove the closed order
      //     setOrders((prevOrders) =>
      //       prevOrders.filter((order) => order.orderId != response.data.orderId)
      //     );
      //   }
      // } else {
      //   if (productChangeStatus.data.updatedOrder.transaction.length == 0) {
      //     const response = await axios.delete(
      //       `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
      //     );
      //     console.log(response.data);

      //     // Update state to remove the closed order
      //     setOrders((prevOrders) =>
      //       prevOrders.filter((order) => order.orderId !== orderId)
      //     );
      //   }
      // }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  if (!isDataLoaded) {
    return <Loader />;
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => toggleDialog(false)}
        className="relative z-50"
      >
        <div className="fixed bottom-0 flex w-screen h-[calc(100vh-48px)] bg-white/80 items-center justify-center">
          <DialogPanel className="min-w-[700px] h-[600px] space-y-4 border bg-white p-8 rounded-md flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-3 items-center">
                <div className="w-24 rounded-md overflow-hidden">
                  <img
                    src={
                      orderInfo.photo
                        ? `https://joinposter.com${orderInfo.photo}`
                        : NoImg
                    }
                    className="w-full"
                    alt=""
                  />
                </div>
                <span className="space-y-2">
                  <p className="text-xl font-semibold">
                    {orderInfo.product_name}
                  </p>
                  <p className="font-medium text-gray-500">
                    Кол-во: {orderInfo.count}
                    {/* {barInfo.comment && "|"}{" "}
                    {barInfo.comment} */}
                  </p>
                </span>
              </div>
              <FaXmark className="w-9 h-9" onClick={() => toggleDialog()} />
            </div>

            {!orderInfo.ingredients ? (
              <div className="w-full h-full flex justify-center items-center text-2xl ">
                <p>Нет ингредиентов</p>
              </div>
            ) : (
              <section className="space-y-2">
                <ul className="flex justify-between border-b border-gray-400 py-3">
                  <li className="w-1/2">Инградиенты </li>
                  <li className="w-2/12">Нетто </li>
                  <li className="w-3/12">Метод приготовления </li>
                  <li className="w-2/12 text-right">Брутто </li>
                </ul>
                <div className="space-y-3 h-60 overflow-y-scroll">
                  {orderInfo.ingredients.map((item, idx) => (
                    <ul key={idx} className="flex justify-between">
                      <li className="w-1/2">{item.ingredient_name}</li>
                      <li className="w-2/12">{item.structure_netto}</li>
                      <li className="w-3/12"></li>
                      <li className="w-2/12 text-right">
                        {item.structure_brutto}
                      </li>
                    </ul>
                  ))}
                </div>
                <p className="mt-3 font-bold">Процесс приготовления</p>
              </section>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  deleteItem(order.orderId, product, "delete");
                  toggleDialog(false);
                }}
                className="bg-red-500 p-3 w-2/5 rounded-md text-white flex justify-between"
              >
                <FaTrashAlt className="w-6 h-6 " />
                <p>Отмена заказа</p>
                <p></p>
              </button>

              <button
                disabled={
                  product.product_id === loading.productId &&
                  loading.loading &&
                  order._id === loading.orderId
                }
                onClick={() => {
                  deleteItem(order.orderId, product, "finished");
                  setLoading({
                    orderId: order._id,
                    productId: product.product_id,
                    loading: true,
                  });
                  toggleDialog(false);
                }}
                className={`${
                  product.status === "cooking"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                } ${
                  product.product_id === loading.productId &&
                  loading.loading &&
                  order._id === loading.orderId &&
                  "bg-opacity-50"
                } text-white text-lg p-3 w-2/5 rounded-md flex justify-between`}
              >
                {product.product_id === loading.productId &&
                loading.loading &&
                order._id === loading.orderId
                  ? "Loading"
                  : product.status === "cooking"}
                <FaRegCheckCircle className="w-6 h-6 " />
                <p>Готово</p>
                <p></p>
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default DialogPopup;
