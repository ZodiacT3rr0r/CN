import { DeviceInstance, Link, LinkStateRoutingTable } from "../../types";

interface RoutingPanelProps {
  devices: DeviceInstance[];
  links: Link[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  routingTables: { [key: string]: LinkStateRoutingTable[] };
  linkStates: { [key: string]: { nodeId: string; neighbors: { [key: string]: number } } };
}

function RoutingPanel({
  devices,
  selected,
  onSelect,
  routingTables,
  linkStates
}: RoutingPanelProps) {
  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-neutral-200">
        Link State Routing Tables
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
              
              {/* Neighbors Section */}
              <div className="mb-3">
                <h4 className="text-sm text-neutral-400 mb-1">Neighbors:</h4>
                <div className="space-y-1">
                  {Object.entries(linkStates[router.instanceId]?.neighbors || {}).map(([neighborId, cost]) => (
                    <div key={neighborId} className="text-sm text-neutral-400 flex justify-between">
                      <span>{neighborId}</span>
                      <span>cost: {cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Routing Table Section */}
              <div>
                <h4 className="text-sm text-neutral-400 mb-1">Routing Table:</h4>
                <div className="space-y-1">
                  {routingTables[router.instanceId]?.map((route) => (
                    <div
                      key={route.destination}
                      className="text-sm text-neutral-400"
                    >
                      <div className="flex justify-between">
                        <span>To: {route.destination}</span>
                        <span>Cost: {route.cost}</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Next Hop: {route.nextHop}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Path: {route.path.join(" → ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default RoutingPanel; 