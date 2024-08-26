import { Dialog, DialogPanel } from "@headlessui/react";
import { useDataContext } from "../context/DataContext";
import { FaXmark } from "react-icons/fa6";
import { FaTrashAlt, FaPlay, FaRegCheckCircle } from "react-icons/fa";
import Loader from "./Loader/Loader";
import NoImg from "../assets/no-img.png";
import toast from "react-hot-toast";

const DialogPopup = () => {
  const { isOpen, toggleDialog, orderInfo, barInfo } = useDataContext();

  const isDataLoaded = orderInfo && barInfo;
  console.log(orderInfo);

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
                    Кол-во: {orderInfo.count} {barInfo.comment && "|"}{" "}
                    {barInfo.comment}
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
                  toast("Будет добавлено в ближайшее время", {
                    icon: "👏",
                  });
                }}
                className="bg-red-500 p-3 w-2/5 rounded-md text-white flex justify-between"
              >
                <FaTrashAlt className="w-6 h-6 " />
                <p>Отмена заказа</p>
                <p></p>
              </button>
              <button
                onClick={() => {
                  toast("Будет добавлено в ближайшее время", {
                    icon: "👏",
                  });
                }}
                className={`${
                  orderInfo.status == "waiting"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                } p-3 w-2/5 rounded-md text-white flex justify-between`}
              >
                {orderInfo.status == "waiting" ? (
                  <>
                    {" "}
                    <FaPlay className="w-6 h-6 " />
                    <p>Начать</p>
                    <p></p>
                  </>
                ) : (
                  <>
                    {" "}
                    <FaRegCheckCircle className="w-6 h-6 " />
                    <p>Готово</p>
                    <p></p>
                  </>
                )}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default DialogPopup;
