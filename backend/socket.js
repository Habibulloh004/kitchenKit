import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "*",
      "http://localhost:5173",
      `${process.env.FRONT_URL}`,
      "https://joinposter.com",
      "https://platform.joinposter.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const companySocketMap = {};
const companies = {};

io.on("connection", (socket) => {
  const companyId = socket.handshake.query.companyId;
  console.log("companyId:",companyId);
  socket.join(companyId);
  socket.on("frontData", (data) => {
    console.log("fr", data);
    socket.to(data.accountData.accountUrl).emit("changeOrderDetails", {
      from: "client",
      data,
    });
  });
  socket.on("deleteItem", (data) => {
    console.log("dl", data);
    socket.to(data.accountData.accountUrl).emit("deleteOrderItem", {
      from: "client",
      data,
    });
  });

  if (companyId !== undefined) companySocketMap[`${socket.id}`] = companyId;

  socket.emit("onlineCompanies", Object.values(companySocketMap));
  companies[socket.id] = true;

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete companySocketMap[socket.id];
    io.emit("onlineCompanies", Object.values(companySocketMap));
    io.emit("companyStatusUpdate", { companyId: companyId, online: false });
  });
});

export { app, io, server };
