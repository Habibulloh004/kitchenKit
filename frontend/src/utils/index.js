const navbarItems = [
  { id: 1, name: "Заказы", path: "/" },
  { id: 2, name: "История", path: "/history" },
];

const formatTimeFromNumber = (number) => {
  const date = new Date(number);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

// eslint-disable-next-line react/prop-types
const truncateText = (text, wordLimit) => {
  if (!text || typeof text !== "string") {
    return ""; // Return an empty string if text is undefined, null, or not a string
  }

  return text.length > wordLimit ? `${text.substring(0, wordLimit)}...` : text;
};

const filterOrders = (orders) => {
  return orders.filter((order) => {
    return order.transaction.some((transaction) => {
      return transaction.commentItems.some((item) => {
        return item.status === "cooking" && item.count > 0;
      });
    });
  }); 
}
// utils.js or wherever your truncateText function is defined

export { navbarItems, formatTimeFromNumber, truncateText, filterOrders };
