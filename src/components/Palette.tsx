// Palette.tsx
import React from "react";
import { Device, DeviceInstance, RoutingTable } from "../types";
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Trash2,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaletteProps {
  devices: Device[];
  routingTables: Record<string, RoutingTable>;
  devicesOnCanvas: DeviceInstance[];
  onReset: () => void;
  onShowHelloPackets: () => void;
  onShowNetworkLog: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function Palette({
  devices,
  routingTables,
  devicesOnCanvas,
  onReset,
  onShowHelloPackets,
  onShowNetworkLog,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: PaletteProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between h-16">
      {/* Left side - Device Palette */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
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
        <button
          onClick={onReset}
          className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 h-10"
        >
          <Trash2 className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={onShowHelloPackets}
          className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 h-10"
        >
          <Mail className="w-4 h-4" />
          Show Hello Packets
        </button>
        <button
          onClick={onShowNetworkLog}
          className="btn btn-secondary flex items-center gap-2 hover:bg-neutral-700/80 h-10"
        >
          <List className="w-4 h-4" />
          Show Network Log
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`btn btn-secondary flex items-center gap-2 ${
            canUndo
              ? "hover:bg-neutral-700/80"
              : "opacity-50 cursor-not-allowed"
          } h-10`}
        >
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`btn btn-secondary flex items-center gap-2 ${
            canRedo
              ? "hover:bg-neutral-700/80"
              : "opacity-50 cursor-not-allowed"
          } h-10`}
        >
          <RotateCw className="w-4 h-4" />
          Redo
        </button>
      </div>
    </div>
  );
}

export default Palette;
