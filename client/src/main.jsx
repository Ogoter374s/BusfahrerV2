import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Create from "./Create";
import Game from "./Game";
import Access from "./Access";
import Account from "./Account";
import Lobbys from "./Lobbys";
import Join from "./Join";
import Phase1 from "./Phase1";
import Phase2 from "./Phase2";
import Phase3 from "./Phase3";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/access" element={<Access />} />
        <Route path="/account" element={<Account />} />
        <Route path="/lobbys" element={<Lobbys />} />
        <Route path="/join/:gameId" element={<Join />} />
        <Route path="/phase1/:gameId" element={<Phase1 />} />
        <Route path="/phase2/:gameId" element={<Phase2 />} />
        <Route path="/phase3/:gameId" element={<Phase3 />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
