import { useEffect, useState } from "react";
import { useDataContext } from "../context/DataContext";
import NoImg from "../assets/no-img.png";

const History = () => {
  const [orders, setOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Retrieve historyOrders from localStorage
    let ordersLocalstorage =
      JSON.parse(localStorage.getItem("historyOrders")) || [];

    if (ordersLocalstorage.length > 0) {
      const firstOrder = ordersLocalstorage[0];
      const createdAt = new Date(firstOrder.createdAt); // Convert createdAt to a Date object
      const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
      const now = new Date();

      // Check if the first order's createdAt is older than one day
      if (now - createdAt > oneDay) {
        // Clear history orders if older than a day
        localStorage.removeItem("historyOrders");
        ordersLocalstorage = []; // Clear the orders array
      }
    }

    // Update the state with the current orders (if any)
    setOrders(ordersLocalstorage);
  }, []);
  const { data } = useDataContext();

  // Function to handle clicking an order
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  // Function to close the popup
  const closePopup = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="w-full h-[90vh] flex p-8">
      {orders.length === 0 ? (
        <p>Заказы отсутствуют</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li
              key={order._id}
              onClick={() => handleOrderClick(order)}
              className="cursor-pointer py-2 px-4 rounded-md bg-white/50 font-semibold"
            >
              № {order.orderId.toString().slice(-4)}
            </li>
          ))}
        </ul>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md shadow-lg max-w-lg w-full">
            <h2 className="text-xl mb-4">Детали заказа</h2>

            {/* Order ID, Waiter's Name, and Table Number */}
            <div className="flex justify-between items-center font-semibold">
              <p className="text-2xl">
                № {selectedOrder.orderInformation.id.toString().slice(-4)}
              </p>
              <span className="text-base text-gray-600 flex flex-col items-end">
                <p>
                  {data
                    ? data.find(
                        (item) =>
                          item?.user_id ==
                          selectedOrder.orderInformation?.userId
                      ).name
                    : "Unknown"}
                </p>
                <p>
                  Стол{" "}
                  {selectedOrder.orderInformation.tableName?.table_num || "N/A"}
                </p>
              </span>
            </div>

            {/* Scrollable Transaction Details Section */}
            <div className="max-h-60 overflow-y-auto">
              {selectedOrder.transaction.map((transaction, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold">
                    Цех: {transaction.workshop_name}
                  </h3>
                  <ul className="space-y-3 mt-3">
                    {transaction.commentItems.map((item, idx) => {
                      if(item.count == 0 || item.status == "deleted") {
                        return null;
                      }
                      
                      return (
                        <li
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <p>
                            {item.category_name} - {item.count}
                          </p>
                          <div className="w-16 rounded-md overflow-hidden">
                            <img
                              src={
                                item.photo
                                  ? `https://joinposter.com${item.photo}`
                                  : NoImg
                              }
                              className="w-full mx-auto"
                              alt=""
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={closePopup}
              className="mt-4 bg-red-500 text-white p-2 rounded"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
