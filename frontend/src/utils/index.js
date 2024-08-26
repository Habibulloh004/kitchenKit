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
  const words = text.split(" ");
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(" ") + "...";
  }
  return text;
};

export { navbarItems, formatTimeFromNumber, truncateText };
