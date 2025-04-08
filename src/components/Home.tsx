import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pattern text-neutral-50 flex flex-col items-center justify-center p-8">
      <div className="bg-neutral-950/80 backdrop-blur-sm p-8 rounded-xl border border-neutral-800 shadow-xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Network Routing Simulator
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div
            onClick={() => navigate("/distance-vector")}
            className="bg-neutral-900/80 p-6 rounded-xl border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
          >
            <h2 className="text-2xl font-semibold mb-4">
              Distance Vector Routing
            </h2>
            <p className="text-neutral-400 mb-4">
              Simulate and visualize the Bellman-Ford algorithm for distance
              vector routing. Watch as routers exchange distance vectors and
              converge to optimal paths.
            </p>
            <div className="text-blue-500 hover:text-blue-400">
              Try it now →
            </div>
          </div>

          <div
            onClick={() => navigate("/link-state")}
            className="bg-neutral-900/80 p-6 rounded-xl border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
          >
            <h2 className="text-2xl font-semibold mb-4">Link State Routing</h2>
            <p className="text-neutral-400 mb-4">
              Explore Dijkstra's algorithm for link state routing. Visualize how
              routers build a complete topology map and compute shortest paths.
            </p>
            <div className="text-blue-500 hover:text-blue-400">
              Coming Soon →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
