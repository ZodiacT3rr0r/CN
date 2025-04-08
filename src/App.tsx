import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LinkStateSimulator from "./components/link-state/LinkStateSimulator";
import DistanceVectorSimulator from "./components/distance-vector/DistanceVectorSimulator";
import Home from "./components/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/link-state" element={<LinkStateSimulator />} />
        <Route path="/distance-vector" element={<DistanceVectorSimulator />} />
      </Routes>
    </Router>
  );
}

export default App;
