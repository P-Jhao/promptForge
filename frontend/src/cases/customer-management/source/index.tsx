import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) throw new Error("客户管理案例缺少 root 节点");
createRoot(root).render(<StrictMode><App /></StrictMode>);
