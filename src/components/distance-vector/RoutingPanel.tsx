import React from "react";
import { DeviceInstance, Link, RoutingTable } from "../../types";

interface RoutingPanelProps {
  devices: DeviceInstance[];
  links: Link[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  routingTables: Record<string, RoutingTable>;
}

function RoutingPanel({
  devices,
  links,
  selected,
  onSelect,
  routingTables,
}: RoutingPanelProps) {
  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-neutral-200">
        Routing Tables
      </h2>
      <div className="space-y-4">
        {devices
          .filter((d) => d.deviceType === "router")
          .map((router) => (
            <div
              key={router.instanceId}
              className={`bg-neutral-800/50 rounded-lg p-4 border ${
                selected === router.instanceId
                  ? "border-neutral-50"
                  : "border-neutral-700"
              } cursor-pointer transition-colors`}
              onClick={() => onSelect(router.instanceId)}
            >
              <h3 className="text-neutral-200 font-medium mb-2">
                {router.name} ({router.instanceId})
              </h3>
              <div className="space-y-2">
                {Object.entries(routingTables[router.instanceId] || {}).map(
                  ([dest, info]) => (
                    <div
                      key={dest}
                      className="text-sm text-neutral-400 flex justify-between"
                    >
                      <span>{dest}</span>
                      <span>
                        via {info.nextHop} (cost: {info.cost})
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default RoutingPanel;
