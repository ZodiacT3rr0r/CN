import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./components/Home";
import DistanceVectorSimulator from "./components/distance-vector/DistanceVectorSimulator";
import LinkStateSimulator from "./components/link-state/LinkStateSimulator";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/distance-vector" element={<DistanceVectorSimulator />} />
        <Route path="/link-state" element={<LinkStateSimulator />} />
      </Routes>
    </Router>
  );
}

export default App;
