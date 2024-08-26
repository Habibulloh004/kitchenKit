import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

// eslint-disable-next-line react/prop-types
export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const userDeatails = JSON.parse(localStorage.getItem("accountSettings"));

  useEffect(() => {
    if (userDeatails) {
      const socket = io("http://localhost:9000", {
        query: {
          companyId: userDeatails.COMPANY_ID,
        },
      });

      setSocket(socket);

      return () => socket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("connect", function () {
        console.log("connected", socket.connected);
      });

      socket.on("message", (data) => {
        console.log("message");
        console.log(data);
      });
      socket.on("disconnect", () => {
        console.log("disconect");
      });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
