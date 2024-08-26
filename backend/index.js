import express from "express";
import dotenv from "dotenv";
import path from "path";
import { app, io, server } from "./socket.js";
import axios from "axios";
import cors from "cors";
import FormData from "form-data";
import mongoose from "mongoose";
import { Order } from "./models/order.model.js";

dotenv.config();
// https://possible4.joinposter.com/api/auth?application_id=3544&redirect_uri=https://kitchenkit.onrender.com/auth&response_type=code

const corsOptions = {
  origin: ["*", "kitchen-kit-front.vercel.app"],
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
// const corsOptions = {
//   origin: "https://kitchenkit.onrender.com", // Allow your React app's origin
//   methods: ["GET", "POST", "PUT", "DELETE"], // Allow only GET and POST requests
//   allowedHeaders: ["Content-Type", "Authorization"], // Allow only headers with Content-Type and Authorization
// };

const port = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(express.json());
app.use(cors(corsOptions));
// app.use(express.static(path.join(__dirname, "/frontend/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
// });

// Root route

// io.on("changeOrderDetails", (data) => {
//   console.log(data);
//   // io.to(data.data.accountData.accountUrl).emit(data)
// })

app.get("/", (req, res) => {
  res.send("Welcome to the Express.js server!");
});

app.get("/auth", async (req, res) => {
  console.log("req.body: ", req.body);
  console.log("req.query: ", req.query);
  if (req.query.code) {
    const auth = {
      application_id: 3544,
      application_secret: "586a61d2f3a718c1d6daeb847e690230",
      code: req.query.code,
      account: req.query.account,
    };
    const formData = new FormData();
    formData.append("application_id", auth.application_id);
    formData.append("application_secret", auth.application_secret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", "https://kitchenkit.onrender.com/auth");
    formData.append("code", auth.code);
    try {
      const response = await axios.post(
        `https://${auth.account}.joinposter.com/api/v2/auth/access_token`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );
      console.log("Access token response data:", response.data);
      window.localStorage.setItem("authToken", response.data.access_token)
      res.cookie("authToken", response.data.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });
      res.redirect(`https://kitchen-kit-front.vercel.app`);
    } catch (error) {
      console.error("Error exchanging code for access token:", error);
      res.status(500).send("Error exchanging code for access token");
    }
  } else {
    res.status(400).send("No code provided");
  }
});

app.get("/checkToken", async (req, res) => {
  // console.log(req.query);
  const accountSettings = await axios.get(
    `https://joinposter.com/api/settings.getAllSettings?token=${req.query.token}`
  );
  // console.log(accountSettings);
  res.send(accountSettings.data);
});

app.get("/getWaiters", async (req, res) => {
  const waiters = await axios.get(
    `https://joinposter.com/api/dash.getWaitersSales?token=${req.query.token}`
  );
  res.send(waiters.data);
});

app.get("/getSpots", async (req, res) => {
  const { token } = req.query;
  if (token) {
    const spots = await axios.get(
      `https://joinposter.com/api/spots.getSpots?token=${token}`
    );
    res.status(200).send(spots.data.response);
  } else {
    res.status(400).send("No token provided");
  }
});

app.get("/getOrder/:id", async (req, res) => {
  const order = await Order.findOne({ orderId: Number(req.params.id) });
  res.send(order);
});

app.post("/getOrders", async (req, res) => {
  const orders = await Order.find({
    "accountData.accountUrl": req.body.accountUrl,
  });
  res.send(orders);
});

app.post("/createOrder", async (req, res) => {
  try {
    const existOrder = await Order.findOne({ orderId: req.body.orderId });
    if (existOrder) {
      await Order.updateOne(
        {
          orderId: req.body.orderId,
        },
        { $set: req.body }
      );

      const changeOrder = await Order.findOne({ orderId: req.body.orderId });

      io.to(existOrder.accountData.accountUrl).emit("changeOrderDetails", {
        from: "poster",
        spotId: existOrder.accountData.spotId,
        order: changeOrder,
      });

      res.send(existOrder);
    } else {
      const result = await Order.create(req.body);
      io.to(result.accountData.accountUrl).emit("createOrder", {
        from: "poster",
        spotId: result.accountData.spotId,
        order: result,
      });
      res.send("create");
    }
  } catch (error) {
    console.log("order creating error", error);
    res.send("internel server error");
  }
});

app.put("/changeOrderStatus/:orderId", async (req, res) => {
  console.log("Request received to change order status");
  const { item } = req.body; // Destructure item from the request body
  const orderId = req.params.orderId; // Extract orderId from the route parameters

  try {
    // Find the order by orderId in the database
    const order = await Order.findOne({ orderId });

    // If the order is not found, return a 404 error
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the index of the workshop in the order's transaction array
    const workshopIndex = order.transaction.findIndex(
      (workshop) => workshop.workshop_id === item.workshop
    );

    if (workshopIndex !== -1) {
      // Filter the comment items based on their status
      order.transaction[workshopIndex].commentItems = order.transaction[
        workshopIndex
      ].commentItems.filter((commentItem) => {
        // Change status from "waiting" to "cooking"
        if (commentItem.product_id === item.product_id) {
          if (commentItem.status === "waiting") {
            commentItem.status = "cooking";
            return true; // Keep the item in the array
          }
          // Remove item if status is "cooking"
          else if (commentItem.status === "cooking") {
            return false; // Remove the item from the array
          }
        }
        return true; // Keep other items unchanged
      });

      // Mark the transaction field as modified
      order.markModified("transaction");

      // Save the updated order to the database
      const updatedOrder = await order.save();

      // Send the updated order back to the client
      res.send(updatedOrder);
    } else {
      // If the workshop is not found, return a 400 error
      return res.status(400).json({ message: "Workshop not found" });
    }
  } catch (error) {
    // Log the error and return a 500 error
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/closeTransaction/:orderId", async (req, res) => {
  const deleted = await Order.deleteOne({ orderId: req.params.orderId });
  console.log(deleted);
  res.send(deleted);
});

mongoose
  .connect(process.env.CONNECT_DB)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });
