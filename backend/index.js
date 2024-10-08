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
// https://possible4.joinposter.com/api/auth?application_id=3629&redirect_uri=http://localhost:9000/auth&response_type=code

const corsOptions = {
  origin: [
    "*",
    "http://localhost:5173",
    `${process.env.FRONT_URL}`,
    "https://platform.joinposter.com",
    "https://platform.joinposter.com",
    "https://d1ce-213-230-82-72.ngrok-free.app"
  ],
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

const port = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(express.json());
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Welcome to the Express.js server!");
});

app.get("/auth", async (req, res) => {
  if (req.query.code) {
    const auth = {
      application_id: 3629,
      application_secret: "88784f4287b6c9b3e0eada9d06b8c4b2",
      code: req.query.code,
      account: req.query.account,
    };
    const formData = new FormData();
    formData.append("application_id", auth.application_id);
    formData.append("application_secret", auth.application_secret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", `${process.env.BACKEND}/auth`);
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
      res.cookie("authToken", response.data.access_token);
      res.redirect(
        `${process.env.FRONT_URL}?token=${response.data.access_token}`
      );
    } catch (error) {
      console.error("Error exchanging code for access token:", error);
      res.status(500).send("Error exchanging code for access token");
    }
  } else {
    res.status(400).send("No code provided");
  }
});

app.get("/findOrder/:order", (req, res) => {
  const findingOrder = Order.findOne({ orderId: Number(req.params.order) });
  
  if (findingOrder) {
    return res.send(findingOrder);
  } else {
    return res.send("No order found!");
  }
});

app.get("/checkToken", async (req, res) => {
  try {
    // Fetch account settings using the provided token
    const accountSettings = await axios.get(
      `https://joinposter.com/api/settings.getAllSettings?token=${req.query.token}`
    );

    // Send the retrieved account settings as the response
    res.send(accountSettings.data);
  } catch (error) {
    // Log the error and send an error response
    console.error("Error fetching account settings:", error.message);
    res.status(500).send({
      error:
        "Failed to fetch account settings. Please check the token and try again.",
      details: error.message,
    });
  }
});

app.get("/getWaiters", async (req, res) => {
  try {
    console.log("req");
    // Fetch employees using the provided token
    const employee = await axios.get(
      `https://joinposter.com/api/access.getEmployees?token=${req.query.token}`
    );

    // Send the filtered waiters as the response
    res.send(employee.data.response);
  } catch (error) {
    // Log the error and send an error response
    console.error("Error fetching waiters:", error.message);
    res.status(500).send({
      error: "Failed to fetch waiters. Please check the token and try again.",
      details: error.message,
    });
  }
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

app.get("/getWorkshops", async (req, res) => {
  const { token } = req.query;
  if (token) {
    const workshops = await axios.get(
      `https://joinposter.com/api/menu.getWorkshops?token=${token}`
    );
    res.status(200).send(workshops.data.response);
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

// app.put("/changeOrderStatus/:orderId", async (req, res) => {
//   console.log("Request received to change order status");
//   const { item } = req.body; // Destructure item from the request body
//   const orderId = req.params.orderId; // Extract orderId from the route parameters

//   try {
//     // Find the order by orderId in the database
//     const order = await Order.findOne({ orderId });

//     // If the order is not found, return a 404 error
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Find the index of the workshop in the order's transaction array
//     const workshopIndex = order.transaction.findIndex(
//       (workshop) => workshop.workshop_id === item.workshop
//     );

//     if (workshopIndex !== -1) {
//       // Filter the comment items based on their status
//       let pr;
//       order.transaction[workshopIndex].commentItems = order.transaction[
//         workshopIndex
//       ].commentItems.filter((commentItem) => {
//         // Change status from "waiting" to "cooking"
//         if (commentItem.product_id === item.product_id) {
//           pr = commentItem;
//           if (commentItem.status === "waiting") {
//             commentItem.status = "cooking";
//             return true; // Keep the item in the array
//           }
//           // Remove item if status is "cooking"
//           else if (commentItem.status === "cooking") {
//             return false; // Remove the item from the array
//           }
//         }
//         return true; // Keep other items unchanged
//       });

//       // Mark the transaction field as modified
//       order.markModified("transaction");

//       // Save the updated order to the database
//       const updatedOrder = await order.save();

//       // Send the updated order back to the client
//       res.send({ updatedOrder, product: pr });
//     } else {
//       // If the workshop is not found, return a 400 error
//       return res.status(400).json({ message: "Workshop not found" });
//     }
//   } catch (error) {
//     // Log the error and return a 500 error
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.put("/deleteItem/:orderId", async (req, res) => {
//   console.log("Request received to delete an item");
//   const { item, order, token, status } = req.body; // Extract item from the request body
//   const orderId = req.params.orderId; // Extract orderId from the route parameters

//   try {
//     // Find the order by orderId in the database
//     const orderMe = await Order.findOne({ orderId });

//     // If the order is not found, return a 404 error
//     if (!orderMe) {
//       return res.status(404).json({ message: "OrderMe not found" });
//     }

//     // Find the index of the workshop in the orderMe's transaction array
//     const workshopIndex = orderMe.transaction.findIndex(
//       (workshop) => workshop.workshop_id == item.workshop
//     );

//     if (workshopIndex !== -1) {
//       // Filter out the item that needs to be deleted
//       const originalLength =
//         orderMe.transaction[workshopIndex].commentItems.length;

//       orderMe.transaction[workshopIndex].commentItems = orderMe.transaction[
//         workshopIndex
//       ].commentItems.filter(
//         (commentItem) => commentItem.product_id != item.product_id
//       );

//       // Check if an item was actually removed
//       if (
//         orderMe.transaction[workshopIndex].commentItems.length == originalLength
//       ) {
//         return res
//           .status(404)
//           .json({ message: "Item not found in the orderMe" });
//       }

//       // Mark the transaction field as modified
//       orderMe.markModified("transaction");

//       // Save the updated orderMe to the database
//       const updatedOrderMe = await orderMe.save();
//       console.log(orderMe);

//       // Send the updated order back to the client
//       if (status == "delete") {
//         // const deleteItem = await axios.post(
//         //   `https://joinposter.com/api/transactions.removeTransactionProduct?token=${token}`,
//         //   {
//         //     spot_id: +order.accountData.spotId,
//         //     spot_tablet_id: +order.accountData.spotTabletId,
//         //     transaction_id: +orderId,
//         //     product_id: +item.product_id,
//         //   }
//         // );
//         // console.log("delete", deleteItem.data);
//       }

//       res.send({ message: "Item deleted successfully", updatedOrderMe });
//     } else {
//       // If the workshop is not found, return a 400 error
//       return res.status(400).json({ message: "Workshop not found" });
//     }
//   } catch (error) {
//     // Log the error and return a 500 error
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.put("/deleteItem/:orderId", async (req, res) => {
//   console.log("Request received to delete an item");
//   const { item, token, status, count } = req.body; // Extract item and count from the request body
//   const orderId = req.params.orderId; // Extract orderId from the route parameters

//   try {
//     // Find the order by orderId in the database
//     const orderMe = await Order.findOne({ orderId });

//     // If the order is not found, return a 404 error
//     if (!orderMe) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Find the index of the workshop in the order's transaction array
//     const workshopIndex = orderMe.transaction.findIndex(
//       (workshop) => workshop.workshop_id == item.workshop
//     );

//     if (workshopIndex !== -1) {
//       // Find the item in the commentItems array
//       const commentItemIndex = orderMe.transaction[
//         workshopIndex
//       ].commentItems.findIndex(
//         (commentItem) => commentItem.product_id == item.product_id
//       );

//       if (commentItemIndex !== -1) {
//         const commentItem =
//           orderMe.transaction[workshopIndex].commentItems[commentItemIndex];

//         // Check if the count to delete is greater than the available count
//         if (count > commentItem.count) {
//           return res
//             .status(400)
//             .json({ message: "Count to delete exceeds available quantity" });
//         }

//         // Decrease the count
//         commentItem.count -= count;

//         // If the count reaches zero, remove the item
//         if (commentItem.count <= 0) {
//           orderMe.transaction[workshopIndex].commentItems.splice(
//             commentItemIndex,
//             1
//           );
//         }

//         // Mark the transaction as modified
//         orderMe.markModified("transaction");

//         // Save the updated order
//         const updatedOrderMe = await orderMe.save();

//         // If status is "delete", make external API call for the deletion
//         if (status == "delete") {
//           // const deleteItem = await axios.post(
//           //   `https://joinposter.com/api/transactions.removeTransactionProduct?token=${token}`,
//           //   {
//           //     spot_id: +order.accountData.spotId,
//           //     spot_tablet_id: +order.accountData.spotTabletId,
//           //     transaction_id: +orderId,
//           //     product_id: +item.product_id,
//           //   }
//           // );
//           // console.log("delete", deleteItem.data);
//         }

//         // Return the updated order
//         res.send({ message: "Item updated successfully", updatedOrderMe });
//       } else {
//         return res
//           .status(404)
//           .json({ message: "Item not found in the workshop" });
//       }
//     } else {
//       return res.status(400).json({ message: "Workshop not found" });
//     }
//   } catch (error) {
//     // Log the error and return a 500 error
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

app.put("/changeOrderStatus/:orderId", async (req, res) => {
  console.log("Request received to change order status");
  const { item, token, status, count } = req.body; // Extract item, status, and count from the request body
  const orderId = req.params.orderId; // Extract orderId from the route parameters

  try {
    // Find the order by orderId in the database
    const orderMe = await Order.findOne({ orderId });

    // If the order is not found, return a 404 error
    if (!orderMe) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the index of the workshop in the order's transaction array
    const workshopIndex = orderMe.transaction.findIndex(
      (workshop) => workshop.workshop_id == item.workshop
    );

    if (workshopIndex !== -1) {
      // Find the item in the commentItems array
      const commentItemIndex = orderMe.transaction[
        workshopIndex
      ].commentItems.findIndex(
        (commentItem) => commentItem.product_id == item.product_id
      );

      if (commentItemIndex !== -1) {
        const commentItem =
          orderMe.transaction[workshopIndex].commentItems[commentItemIndex];

        // Check if count adjustment is necessary
        if (count && count > 0 && count <= commentItem.count) {
          commentItem.count -= count;
        }

        // Update the status of the item based on the input
        if (status) {
          commentItem.status = status;
        }

        // Mark the transaction as modified
        orderMe.markModified("transaction");

        // Save the updated order
        const updatedOrderMe = await orderMe.save();

        // Optionally handle an external API call based on status (if needed)
        if (status === "delete") {
          // Optionally handle deletion API logic here
          // const deleteItem = await axios.post(
          //   `https://joinposter.com/api/transactions.removeTransactionProduct?token=${token}`,
          //   {
          //     spot_id: +order.accountData.spotId,
          //     spot_tablet_id: +order.accountData.spotTabletId,
          //     transaction_id: +orderId,
          //     product_id: +item.product_id,
          //   }
          // );
          // console.log("delete", deleteItem.data);
        }

        // Return the updated order
        res.send({
          message: "Order status updated successfully",
          updatedOrderMe,
        });
      } else {
        return res
          .status(404)
          .json({ message: "Item not found in the workshop" });
      }
    } else {
      return res.status(400).json({ message: "Workshop not found" });
    }
  } catch (error) {
    // Log the error and return a 500 error
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// app.put("/closeTransaction/:orderId", async (req, res) => {
//   const { workshopId } = req.body;
//   const { orderId } = req.params;

//   try {
//     // Find the order and remove the workshop from the transaction array
//     const updatedOrder = await Order.findOneAndUpdate(
//       { orderId },
//       { $pull: { transaction: { workshop_id: workshopId } } }, // Adjust this to match your schema
//       { new: true }
//     );

//     if (updatedOrder) {
//       res.send(updatedOrder);
//     } else {
//       res.status(404).send({ message: "Order not found" });
//     }
//   } catch (error) {
//     console.error("Error updating order", error);
//     res.status(500).send({ message: "Error updating order" });
//   }
// });

app.put("/closeTransaction/:orderId", async (req, res) => {
  const { workshopId } = req.body; // Extract the workshopId from the body (if relevant)
  const { orderId } = req.params; // Extract the orderId from the parameters

  try {
    // Find the order by orderId
    const orderMe = await Order.findOne({ orderId });

    if (!orderMe) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If a specific workshopId is provided, update only that workshop, otherwise update all workshops
    if (workshopId) {
      // Find the index of the workshop in the order's transaction array
      const workshopIndex = orderMe.transaction.findIndex(
        (workshop) => workshop.workshop_id == workshopId
      );

      if (workshopIndex !== -1) {
        // Update all "cooking" items to "finished" in the specified workshop
        orderMe.transaction[workshopIndex].commentItems = orderMe.transaction[
          workshopIndex
        ].commentItems.map((commentItem) =>
          commentItem.status === "cooking"
            ? { ...commentItem, status: "finished" }
            : commentItem
        );
      } else {
        return res.status(404).json({ message: "Workshop not found" });
      }
    } else {
      // If no workshopId is provided, update all workshops
      orderMe.transaction.forEach((workshop) => {
        workshop.commentItems = workshop.commentItems.map((commentItem) =>
          commentItem.status === "cooking"
            ? { ...commentItem, status: "finished" }
            : commentItem
        );
      });
    }

    // Mark the transaction as modified and save the updated order
    orderMe.markModified("transaction");
    const updatedOrderMe = await orderMe.save();

    // Return the updated order
    res.send({
      message: "All cooking items marked as finished",
      updatedOrderMe,
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating order", error);
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
