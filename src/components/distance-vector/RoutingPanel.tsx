import React, { useEffect, useState } from "react";
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
  const [previousTables, setPreviousTables] = useState<Record<string, RoutingTable>>({});
  const [highlightedCells, setHighlightedCells] = useState<Record<string, Set<string>>>({});

  // Effect to detect changes in routing tables and highlight them
  useEffect(() => {
    const newHighlightedCells: Record<string, Set<string>> = {};

    Object.entries(routingTables).forEach(([routerId, table]) => {
      const prevTable = previousTables[routerId];
      if (!prevTable) {
        // New router, highlight all cells
        newHighlightedCells[routerId] = new Set(Object.keys(table));
      } else {
        // Compare with previous table
        const changedCells = new Set<string>();
        Object.entries(table).forEach(([dest, info]) => {
          const prevInfo = prevTable[dest];
          if (!prevInfo || prevInfo.nextHop !== info.nextHop || prevInfo.cost !== info.cost) {
            changedCells.add(dest);
          }
        });
        if (changedCells.size > 0) {
          newHighlightedCells[routerId] = changedCells;
        }
      }
    });

    setHighlightedCells(newHighlightedCells);
    setPreviousTables(routingTables);

    // Clear highlights after animation
    const timer = setTimeout(() => {
      setHighlightedCells({});
    }, 1000);

    return () => clearTimeout(timer);
  }, [routingTables]);

  // Get all router IDs in order
  const routerIds = devices
    .filter(d => d.deviceType === "router")
    .map(d => d.instanceId)
    .sort();

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
                {routerIds.map((dest) => {
                  const info = routingTables[router.instanceId]?.[dest];
                  if (!info) return null;
                  return (
                    <div
                      key={dest}
                      className={`text-sm text-neutral-400 flex justify-between transition-colors duration-300 ${
                        highlightedCells[router.instanceId]?.has(dest)
                          ? "bg-green-500/20 text-green-400"
                          : ""
                      }`}
                    >
                      <span>{dest}</span>
                      <span>
                        via {info.nextHop} (cost: {info.cost})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default RoutingPanel;