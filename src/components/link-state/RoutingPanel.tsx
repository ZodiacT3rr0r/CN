import React from "react";
import { DeviceInstance, Link, RoutingTable, LSPacket } from "../../types";

interface RoutingPanelProps {
  devices: DeviceInstance[];
  links: Link[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  routingTables: Record<string, RoutingTable>;
  networkState: Record<string, LSPacket>;
  isHelloPhaseComplete: boolean;
  isFloodingComplete: boolean;
  onShowNeighbours?: () => void;
  onShowNetworkTopology?: () => void;
  onShowRoutingTables?: () => void;
}

export default function RoutingPanel({
  devices,
  links,
  selected,
  onSelect,
  routingTables,
  networkState,
  isHelloPhaseComplete,
  isFloodingComplete,
  onShowNeighbours,
  onShowNetworkTopology,
  onShowRoutingTables,
}: RoutingPanelProps) {
  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-neutral-200">Devices</h2>
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.instanceId}
              className={`p-2 rounded cursor-pointer ${
                selected === device.instanceId
                  ? "bg-neutral-800"
                  : "hover:bg-neutral-800/50"
              }`}
              onClick={() => onSelect(device.instanceId)}
            >
              <div className="flex items-center">
                <device.icon className="w-4 h-4 mr-2 text-neutral-200" />
                <span className="text-neutral-200">{device.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onShowNeighbours}
          disabled={!isHelloPhaseComplete}
          className={`w-full px-4 py-2 text-sm font-medium text-white rounded ${
            isHelloPhaseComplete
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-neutral-700 cursor-not-allowed"
          }`}
        >
          Show Neighbours
        </button>

        <button
          onClick={onShowNetworkTopology}
          disabled={!isFloodingComplete}
          className={`w-full px-4 py-2 text-sm font-medium text-white rounded ${
            isFloodingComplete
              ? "bg-green-600 hover:bg-green-700"
              : "bg-neutral-700 cursor-not-allowed"
          }`}
        >
          Show Network Topology
        </button>

        <button
          onClick={onShowRoutingTables}
          disabled={!isFloodingComplete}
          className={`w-full px-4 py-2 text-sm font-medium text-white rounded ${
            isFloodingComplete
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-neutral-700 cursor-not-allowed"
          }`}
        >
          Show Routing Tables
        </button>
      </div>

      {selected && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2 text-neutral-200">
            Routing Table
          </h3>
          <div className="space-y-2">
            {Object.entries(routingTables[selected] || {}).map(
              ([destination, route]) => (
                <div
                  key={destination}
                  className="p-2 bg-neutral-800/50 rounded text-sm text-neutral-200"
                >
                  <div>Destination: {destination}</div>
                  <div>Next Hop: {route.nextHop}</div>
                  <div>Cost: {route.cost}</div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
