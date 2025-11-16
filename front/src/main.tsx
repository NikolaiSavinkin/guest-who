import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Participant from "./participant/Participant.tsx";
import Host from "./host/Host.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Participant />} />
                <Route path="/host" element={<Host />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
