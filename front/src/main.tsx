import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Participant from "./participant/Participant.tsx";
import Admin from "./admin/Admin.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Participant />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
