import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import DistanceVectorSimulator from "./components/DistanceVectorSimulator";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/distance-vector" element={<DistanceVectorSimulator />} />
        <Route path="/link-state" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
