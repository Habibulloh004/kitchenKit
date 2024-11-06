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
import toast from "react-hot-toast";

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
  // const [promptCount, setPromptCount] = useState("")
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

  // const deleteItem = async (orderId, item, status, count) => {
  //   try {
  //     const productChangeStatus = await axios.put(
  //       `${import.meta.env.VITE_BACKEND}/changeOrderStatus/${orderId}`,
  //       { item, order, token, status, count }
  //     );

  //     const updatedTransactions =
  //       productChangeStatus.data.updatedOrderMe.transaction;

  //     if (!updatedTransactions || !Array.isArray(updatedTransactions)) {
  //       throw new Error("Invalid response from the server.");
  //     }

  //     setOrders((prevOrders) =>
  //       prevOrders.map((order) =>
  //         order.orderId === productChangeStatus.data.updatedOrderMe.orderId
  //           ? { ...order, ...productChangeStatus.data.updatedOrderMe }
  //           : order
  //       )
  //     );

  //     // setOrders((prevOrders) => {
  //     //   return prevOrders.map((order) => {
  //     //     if (
  //     //       order.orderId === productChangeStatus.data.updatedOrderMe.orderId
  //     //     ) {
  //     //       return {
  //     //         ...order,
  //     //         transaction: order.transaction.map((transaction) => {
  //     //           const updatedTransaction = updatedTransactions.find(
  //     //             (updatedTran) =>
  //     //               updatedTran.workshop_id === transaction.workshop_id
  //     //           );

  //     //           if (!updatedTransaction) {
  //     //             return transaction;
  //     //           }

  //     //           return {
  //     //             ...transaction,
  //     //             commentItems: transaction.commentItems
  //     //               .map((commentItem) => {
  //     //                 const updatedItem = updatedTransaction.commentItems.find(
  //     //                   (updatedItem) =>
  //     //                     updatedItem.product_id === commentItem.product_id
  //     //                 );
  //     //                 if (updatedItem) {
  //     //                   return { ...commentItem, status: updatedItem.status };
  //     //                 }
  //     //                 return commentItem;
  //     //               })
  //     //               .filter((commentItem) =>
  //     //                 updatedTransaction.commentItems.some(
  //     //                   (updatedItem) =>
  //     //                     updatedItem.product_id === commentItem.product_id
  //     //                 )
  //     //               ),
  //     //           };
  //     //         }),
  //     //       };
  //     //     }
  //     //     return order;
  //     //   });
  //     // });

  //     if (status == "finished") {
  //       socket.emit("frontData", {
  //         ...productChangeStatus.data.updatedOrderMe,
  //         item,
  //         status,
  //       });
  //     } else {
  //       socket.emit("deleteItem", {
  //         ...productChangeStatus.data.updatedOrderMe,
  //         item,
  //         status,
  //         count
  //       });
  //     }

  //     // Set loading state to false after updating orders
  //     setLoading({
  //       orderId: 0,
  //       productId: 0,
  //       loading: false,
  //     });

  //     // console.log("updating", productChangeStatus.data.updatedOrderMe);

  //     if (chosenWorkshop == null) {
  //       const checkAllCommentItems = async (order) => {
  //         // Check if all commentItems arrays are empty
  //         const allEmpty = order.data.updatedOrderMe.transaction.every(
  //           (transactionItem) => transactionItem.commentItems.length === 0
  //         );

  //         // Output 0 if all are empty, otherwise 1
  //         if (allEmpty) {
  //           const response = await axios.delete(
  //             `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
  //           );
  //           console.log("baaack", response.data);

  //           // Update state to remove the closed order
  //           setOrders((prevOrders) =>
  //             prevOrders.filter((order) => order.orderId !== orderId)
  //           );

  //           socket.emit("frontData", {
  //             ...order.data.updatedOrderMe,
  //             item: "all",
  //           });
  //         }
  //       };

  //       // Calling the function with the sample data
  //       checkAllCommentItems(productChangeStatus);
  //     } else {
  //       const chosenWorkshopId = chosenWorkshop.workshop_id; // Extract workshop_id from chosenWorkshop

  //       const index =
  //         productChangeStatus.data.updatedOrderMe.transaction.findIndex(
  //           (item) => item.workshop_id == chosenWorkshopId
  //         );
  //       if (
  //         productChangeStatus.data.updatedOrderMe.transaction[index]
  //           .commentItems.length == 0
  //       ) {
  //         setOrders((prevOrders) =>
  //           prevOrders.filter(
  //             (order) =>
  //               order.orderId != productChangeStatus.data.updatedOrderMe.orderId
  //           )
  //         );
  //       }
  //       let filterWorkshop = productChangeStatus.data.updatedOrderMe;

  //       // Filter transactions based on the chosen workshop if applicable
  //       const filteredTransactions =
  //         productChangeStatus.data.updatedOrderMe.transaction.filter(
  //           (transaction) => {
  //             return transaction.workshop_id == chosenWorkshop.workshop_id;
  //           }
  //         );

  //       // Update the order to only include the filtered transactions
  //       filterWorkshop = {
  //         ...productChangeStatus.data.updatedOrderMe,
  //         transaction: filteredTransactions,
  //       };

  //       // Update the order in the state by matching the orderId
  //       setOrders((prevOrders) =>
  //         prevOrders.map(
  //           (order) =>
  //             order.orderId === productChangeStatus.data.updatedOrderMe.orderId
  //               ? { ...order, ...filterWorkshop } // Update the order with new data
  //               : order // Keep the same order if the ID does not match
  //         )
  //       );
  //     }

  //     // if (chosenWorkshop) {
  //     //   const chosenWorkshopId = chosenWorkshop.workshop_id; // Extract workshop_id from chosenWorkshop

  //     //   const index =
  //     //     productChangeStatus.data.updatedOrder.transaction.findIndex(
  //     //       (item) => item.workshop_id == chosenWorkshopId
  //     //     );
  //     //   console.log("indexxxx", index);
  //     //   console.log("ooooor", order.transaction);

  //     //   if (order.transaction[index].commentItems.length == 0) {
  //     //     const response = await axios.delete(
  //     //       `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
  //     //     );

  //     //     console.log("ressss:", response.data);

  //     //     // Update state to remove the closed order
  //     //     setOrders((prevOrders) =>
  //     //       prevOrders.filter((order) => order.orderId != response.data.orderId)
  //     //     );
  //     //   }
  //     // } else {
  //     //   if (productChangeStatus.data.updatedOrder.transaction.length == 0) {
  //     //     const response = await axios.delete(
  //     //       `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
  //     //     );
  //     //     console.log(response.data);

  //     //     // Update state to remove the closed order
  //     //     setOrders((prevOrders) =>
  //     //       prevOrders.filter((order) => order.orderId !== orderId)
  //     //     );
  //     //   }
  //     // }
  //   } catch (error) {
  //     console.error("Error updating status", error);
  //   }
  // };

  const deleteItem = async (orderId, item, status, count) => {
    try {
      const productChangeStatus = await axios.put(
        `${import.meta.env.VITE_BACKEND}/changeOrderStatus/${orderId}`,
        { item, order, token, status, count }
      );

      const updatedOrder = productChangeStatus.data.updatedOrderMe;

      if (!updatedOrder || !Array.isArray(updatedOrder.transaction)) {
        throw new Error("Invalid response from the server.");
      }

      // Determine workshop IDs based on whether chosenWorkshop is an array or a single object
      let workshopIds = [];
      if (chosenWorkshop) {
        workshopIds = Array.isArray(chosenWorkshop)
          ? chosenWorkshop.map((workshop) => workshop.workshop_id)
          : [chosenWorkshop.workshop_id];
      }

      // Filter transactions based on the workshop IDs if chosenWorkshop is provided
      let filteredOrder = { ...updatedOrder };
      if (workshopIds.length > 0) {
        const filteredTransactions = updatedOrder.transaction.filter(
          (transaction) => workshopIds.includes(transaction.workshop_id)
        );
        filteredOrder = { ...updatedOrder, transaction: filteredTransactions };
      }

      // Update the orders state with the modified order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === updatedOrder.orderId
            ? { ...order, ...filteredOrder }
            : order
        )
      );

      // Emit socket event based on the status
      if (status === "finished") {
        socket.emit("frontData", {
          ...updatedOrder,
          item,
          status,
        });
      } else {
        socket.emit("deleteItem", {
          ...updatedOrder,
          item,
          status,
          count,
        });
      }

      // Set loading state to false after updating orders
      setLoading({
        orderId: 0,
        productId: 0,
        loading: false,
      });

      // Check if any transactions remain for the specified workshop(s)
      if (workshopIds.length > 0) {
        const hasRemainingItems = updatedOrder.transaction.some(
          (transaction) =>
            workshopIds.includes(transaction.workshop_id) &&
            transaction.commentItems.length > 0
        );

        if (!hasRemainingItems) {
          // Remove the order if all chosen workshop transactions are empty
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orderId !== updatedOrder.orderId)
          );
        }
      } else {
        // If no specific workshop is chosen, check if all transactions are empty
        const allTransactionsEmpty = updatedOrder.transaction.every(
          (transaction) => transaction.commentItems.length === 0
        );

        if (allTransactionsEmpty) {
          await axios.delete(
            `${import.meta.env.VITE_BACKEND}/closeTransaction/${orderId}`
          );

          // Remove the order from the state
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orderId !== orderId)
          );

          socket.emit("frontData", {
            ...updatedOrder,
            item: "all",
          });
        }
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  if (!isDataLoaded) {
    return <Loader />;
  }
  // console.log(promptCount);

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
                <span className="space-y-2 text-xl">
                  <p className=" font-semibold">
                    {console.log(orderInfo)}
                    {orderInfo.product_name}{" "}
                    {`${
                      orderInfo.modificationName
                        ? `(${orderInfo.modificationName})`
                        : ""
                    }`}
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
                  <li className="w-2/12">Брутто </li>
                  <li className="w-3/12">Метод приготовления </li>
                  <li className="w-2/12 text-right">Нетто </li>
                </ul>
                <div className="space-y-3 h-60 overflow-y-scroll">
                  {orderInfo.ingredients.map((item, idx) => (
                    <ul key={idx} className="flex justify-between">
                      <li className="w-1/2">{item.ingredient_name}</li>
                      <li className="w-2/12">
                        {parseFloat(item.structure_brutto)}{" "}
                        {item.structure_unit == "g"
                          ? "г"
                          : item.structure_unit == "l"
                          ? "л"
                          : item.structure_unit == "p"
                          ? "шт"
                          : "мл"}
                      </li>
                      <li className="w-3/12"></li>
                      <li className="w-2/12 text-right">
                        {item.structure_netto}{" "}
                        {item.structure_unit == "g"
                          ? "г"
                          : item.structure_unit == "l"
                          ? "л"
                          : item.structure_unit == "p"
                          ? "шт"
                          : "мл"}
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
                  let promptCount = parseInt(prompt("Добавить количество"), 10);

                  if (isNaN(promptCount) || promptCount <= 0) {
                    toast.error("Пожалуйста, введите допустимое количество.");
                    return;
                  }

                  if (promptCount > orderInfo.count) {
                    toast.error("Входное значение большое");
                  } else {
                    deleteItem(order.orderId, product, "delete", promptCount);
                  }
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
