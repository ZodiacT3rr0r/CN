// Palette.tsx
import React from "react";
import { Device } from "../types";
import {
  ArrowLeft,
  Mail,
  RotateCcw,
  RotateCw,
  Trash2,
  List,
  Play,
  Pause,
  StepForward,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type SimulatorType = "distance-vector" | "link-state";

interface PaletteProps {
  devices: Device[];
  onReset: () => void;
  onShowHelloPackets: () => void;
  onShowNetworkLog: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onLSPFlooding: () => void;
  isLSPFlooding: boolean;
  simulatorType: SimulatorType;
  // Distance Vector specific props
  onSimulationStart?: () => void;
  onSimulationStop?: () => void;
  onSimulationReset?: () => void;
  onSimulationStep?: () => void;
  isSimulationRunning?: boolean;
  isConverged?: boolean;
}

function Palette({
  devices,
  onReset,
  onShowHelloPackets,
  onShowNetworkLog,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onLSPFlooding,
  isLSPFlooding,
  simulatorType,
  onSimulationStart,
  onSimulationStop,
  onSimulationReset,
  onSimulationStep,
  isSimulationRunning,
  isConverged
}: PaletteProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between h-16">
      {/* Left side - Device Palette */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            navigate("/", { replace: true });
          }}
          className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 h-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
          <h2 className="text-neutral-50 font-medium">Devices</h2>
          <div className="flex gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("deviceId", device.id);
                }}
                className={`${device.color} w-10 h-10 rounded-xl flex items-center justify-center cursor-move transition-transform hover:scale-105`}
              >
                {React.createElement(device.icon, {
                  className: "w-6 h-6 text-neutral-50",
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Control Buttons */}
      <div className="flex items-center gap-4">
        {simulatorType === "distance-vector" ? (
          // Distance Vector Simulator Controls
          <>
            {/* Simulation Controls */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">Simulation</h2>
              <div className="flex gap-2">
                <button
                  onClick={onSimulationReset}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={isSimulationRunning ? onSimulationStop : onSimulationStart}
                  className={`btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 ${
                    isConverged ? "bg-green-500/20" : ""
                  }`}
                  title={isSimulationRunning ? "Stop Simulation" : "Start Simulation"}
                >
                  {isSimulationRunning ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onSimulationStep}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80"
                  title="Next Step"
                >
                  <StepForward className="w-4 h-4" />
                </button>
              </div>
              {isConverged && (
                <span className="text-green-500 text-sm font-medium">
                  Network Converged
                </span>
              )}
            </div>

            {/* History Controls */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">History</h2>
              <div className="flex gap-2">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 disabled:opacity-50"
                  title="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 disabled:opacity-50"
                  title="Redo"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          // Link State Simulator Controls
          <>
            {/* Hello Packets Control */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">Hello Packets</h2>
              <div className="flex gap-2">
                <button
                  onClick={onShowHelloPackets}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80"
                  title="Show Hello Packets"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LSP Flooding Control */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">LSP Flooding</h2>
              <div className="flex gap-2">
                <button
                  onClick={onLSPFlooding}
                  className={`btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 ${
                    isLSPFlooding ? "bg-blue-500/20" : ""
                  }`}
                  title="LSP Flooding"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Network Log Control */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">Network Log</h2>
              <div className="flex gap-2">
                <button
                  onClick={onShowNetworkLog}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80"
                  title="Show Network Log"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reset Control */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">Reset</h2>
              <div className="flex gap-2">
                <button
                  onClick={onReset}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* History Controls */}
            <div className="bg-neutral-800/50 rounded-lg px-4 py-2 border border-neutral-700 flex items-center gap-4 h-10">
              <h2 className="text-neutral-50 font-medium">History</h2>
              <div className="flex gap-2">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 disabled:opacity-50"
                  title="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 disabled:opacity-50"
                  title="Redo"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Palette;
