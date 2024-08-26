import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataContextProvider } from "./context/DataContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DataContextProvider>
          <AuthProvider>
            <SocketContextProvider>
              <App />
            </SocketContextProvider>
          </AuthProvider>
        </DataContextProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
