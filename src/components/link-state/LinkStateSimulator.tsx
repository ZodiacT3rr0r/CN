import React, { useState, useEffect } from "react";
import { Router, X } from "lucide-react";
import {
  Device,
  DeviceInstance,
  Link,
  RoutingTable,
  NetworkEvent,
  LSPacket,
} from "../../types";
import Canvas from "../Canvas";
import Palette from "../Palette";
import RoutingPanel from "./RoutingPanel";
import NetworkLogModal from "../NetworkLogModal";
import ImportExportButtons from "../ImportExportButtons";

export default function LinkStateSimulator() {
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [animations, setAnimations] = useState<
    { from: string; to: string; id: number; type: "hello" | "dv" }[]
  >([]);
  const [routingTables, setRoutingTables] = useState<
    Record<string, RoutingTable>
  >({});
  const [networkState, setNetworkState] = useState<{
    [nodeId: string]: LSPacket;
  }>({});
  const [isHelloPhaseComplete, setIsHelloPhaseComplete] = useState(false);
  const [isFloodingComplete, setIsFloodingComplete] = useState(false);
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(false);
  const [routerCount, setRouterCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showNeighboursModal, setShowNeighboursModal] = useState(false);
  const [showTopologyModal, setShowTopologyModal] = useState(false);
  const [showRoutingTablesModal, setShowRoutingTablesModal] = useState(false);

  const availableDevices: Device[] = [
    {
      id: "router",
      type: "router",
      color: "bg-blue-500",
      icon: Router,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        setDeviceToDelete(selected);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  const handleDrop = (device: Device, x: number, y: number) => {
    const instanceId = `R${routerCount + 1}`;
    const newDevice: DeviceInstance = {
      ...device,
      instanceId,
      deviceType: device.type,
      name: `ROUTER${routerCount + 1}`,
      position: { x, y },
      interfaces: [],
    };

    setDevices((prev) => [...prev, newDevice]);
    setRouterCount((prev) => prev + 1);

    setNetworkEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "node_added",
        details: {
          nodeId: instanceId,
          position: { x, y },
        },
      },
    ]);
  };

  const handleMove = (instanceId: string, x: number, y: number) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.instanceId === instanceId ? { ...d, position: { x, y } } : d
      )
    );

    setNetworkEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "node_moved",
        details: {
          nodeId: instanceId,
          position: { x, y },
        },
      },
    ]);
  };

  const startHelloPhase = async () => {
    setIsHelloPhaseComplete(false);
    setIsFloodingComplete(false);
    setNetworkState({});
    setNetworkEvents([]);

    // Each node sends Hello packets to its neighbors
    for (const device of devices) {
      const neighbors = links
        .filter(
          (link) =>
            link.from === device.instanceId || link.to === device.instanceId
        )
        .map((link) => ({
          id: link.from === device.instanceId ? link.to : link.from,
          cost: link.weight,
        }));

      // Add to network state
      setNetworkState((prev) => ({
        ...prev,
        [device.instanceId]: {
          sourceId: device.instanceId,
          sequenceNumber: 1,
          neighbors,
        },
      }));

      // Animate Hello packets
      const animations = neighbors.map((neighbor) => ({
        from: device.instanceId,
        to: neighbor.id,
        id: Date.now() + Math.random(),
        type: "hello" as const,
      }));

      setAnimations(animations);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for animations

      // Log each hello packet
      neighbors.forEach((neighbor) => {
        setNetworkEvents((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: "packet_sent",
            details: {
              packetId: Date.now(),
              fromNode: device.instanceId,
              toNode: neighbor.id,
            },
          },
        ]);
      });
    }

    setIsHelloPhaseComplete(true);
  };

  const handleStartLSPFlooding = () => {
    if (!isHelloPhaseComplete) return;

    // Create LSP packets for each router
    const lspPackets: LSPacket[] = devices
      .filter((d) => d.deviceType === "router")
      .map((router) => {
        const neighbors = links
          .filter(
            (link) =>
              link.from === router.instanceId || link.to === router.instanceId
          )
          .map((link) => ({
            id: link.from === router.instanceId ? link.to : link.from,
            cost: link.weight,
          }));

        return {
          sourceId: router.instanceId,
          sequenceNumber: 1,
          neighbors,
        };
      });

    // Start flooding process
    const newNetworkState = { ...networkState };
    lspPackets.forEach((packet) => {
      newNetworkState[packet.sourceId] = packet;
    });

    setNetworkState(newNetworkState);
    setIsFloodingComplete(true);

    // Add network events for LSP flooding
    const newEvents = [...networkEvents];
    lspPackets.forEach((packet) => {
      newEvents.push({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "packet_sent",
        details: {
          packetId: Date.now(),
          fromNode: packet.sourceId,
          toNode: "ALL", // Broadcast to all neighbors
          packetType: "LSP",
        },
      });
    });
    setNetworkEvents(newEvents);
  };

  const handleShowNeighbours = () => {
    if (!isHelloPhaseComplete) return;
    setShowNeighboursModal(true);
  };

  const handleShowNetworkTopology = () => {
    if (!isFloodingComplete) return;
    setShowTopologyModal(true);
  };

  const handleShowRoutingTables = () => {
    if (!isFloodingComplete) return;
    setShowRoutingTablesModal(true);
  };

  const handleReset = () => {
    setDevices([]);
    setLinks([]);
    setRoutingTables({});
    setNetworkState({});
    setIsHelloPhaseComplete(false);
    setIsFloodingComplete(false);
    setNetworkEvents([]);
    setRouterCount(0);
  };

  const handleExport = () => {
    const state = {
      devices,
      links,
      networkEvents,
      routerCount,
      networkState,
      isHelloPhaseComplete,
      isFloodingComplete,
    };

    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "network-state.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: string) => {
    try {
      const state = JSON.parse(data);

      // Validate the imported data structure
      if (!state.devices || !Array.isArray(state.devices)) {
        throw new Error("Invalid devices data");
      }
      if (!state.links || !Array.isArray(state.links)) {
        throw new Error("Invalid links data");
      }
      if (!state.networkEvents || !Array.isArray(state.networkEvents)) {
        throw new Error("Invalid network events data");
      }
      if (typeof state.routerCount !== "number") {
        throw new Error("Invalid router count");
      }

      // Validate each device has required properties
      state.devices.forEach((device: any) => {
        if (
          !device.instanceId ||
          !device.deviceType ||
          !device.name ||
          !device.position
        ) {
          throw new Error("Invalid device properties");
        }
      });

      // Validate each link has required properties
      state.links.forEach((link: any) => {
        if (!link.from || !link.to || typeof link.weight !== "number") {
          throw new Error("Invalid link properties");
        }
      });

      // Reset the state
      setDevices([]);
      setLinks([]);
      setNetworkEvents([]);
      setSelected(null);
      setAnimations([]);
      setNetworkState({});
      setIsHelloPhaseComplete(false);
      setIsFloodingComplete(false);

      // Restore device icons based on device type
      const restoredDevices = state.devices.map((device: any) => {
        const baseDevice = availableDevices.find(
          (d) => d.type === device.deviceType
        );
        if (!baseDevice) {
          throw new Error(`Unknown device type: ${device.deviceType}`);
        }
        return {
          ...device,
          icon: baseDevice.icon,
          color: baseDevice.color,
        };
      });

      // Set the new state
      setDevices(restoredDevices);
      setLinks(state.links);
      setNetworkEvents(state.networkEvents);
      setRouterCount(state.routerCount);
      setNetworkState(state.networkState || {});
      setIsHelloPhaseComplete(state.isHelloPhaseComplete || false);
      setIsFloodingComplete(state.isFloodingComplete || false);
    } catch (error) {
      console.error("Import error:", error);
      alert(
        `Failed to import network state: ${
          error instanceof Error ? error.message : "Invalid file format"
        }`
      );
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    // Remove the device
    setDevices((prev) => prev.filter((d) => d.instanceId !== deviceId));

    // Remove all links connected to this device
    setLinks((prev) =>
      prev.filter((link) => link.from !== deviceId && link.to !== deviceId)
    );

    // Remove from network state
    setNetworkState((prev) => {
      const newState = { ...prev };
      delete newState[deviceId];
      return newState;
    });

    // Remove from routing tables
    setRoutingTables((prev) => {
      const newTables = { ...prev };
      delete newTables[deviceId];
      return newTables;
    });

    // Add network event
    setNetworkEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "node_removed",
        details: {
          nodeId: deviceId,
        },
      },
    ]);

    setSelected(null);
    setDeviceToDelete(null);
  };

  return (
    <div className="flex flex-col h-screen bg-pattern">
      <Palette
        devices={availableDevices}
        routingTables={routingTables}
        devicesOnCanvas={devices}
        onReset={handleReset}
        onShowHelloPackets={startHelloPhase}
        onShowNetworkLog={() => setIsNetworkLogOpen(true)}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        onStartLSPFlooding={handleStartLSPFlooding}
        isHelloPhaseComplete={isHelloPhaseComplete}
      />

      <div className="flex flex-1 overflow-hidden">
        <RoutingPanel
          devices={devices}
          links={links}
          selected={selected}
          onSelect={setSelected}
          routingTables={routingTables}
          networkState={networkState}
          isHelloPhaseComplete={isHelloPhaseComplete}
          isFloodingComplete={isFloodingComplete}
          onShowNeighbours={handleShowNeighbours}
          onShowNetworkTopology={handleShowNetworkTopology}
          onShowRoutingTables={handleShowRoutingTables}
        />

        <div className="flex-1 p-4 overflow-hidden relative">
          <Canvas
            devices={devices}
            availableDevices={availableDevices}
            links={links}
            setLinks={setLinks}
            selected={selected}
            setSelected={setSelected}
            onDrop={handleDrop}
            onMove={handleMove}
            animations={animations}
            setAnimations={setAnimations}
          />
          <ImportExportButtons
            onImport={handleImport}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Neighbours Modal */}
      {showNeighboursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-neutral-900 p-6 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-200">
                Neighbour Information
              </h2>
              <button
                onClick={() => setShowNeighboursModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {devices
                .filter((d) => d.deviceType === "router")
                .map((router) => (
                  <div
                    key={router.instanceId}
                    className="bg-neutral-800 p-4 rounded"
                  >
                    <h3 className="text-lg font-medium text-neutral-200 mb-2">
                      {router.name}
                    </h3>
                    <div className="space-y-2">
                      {networkState[router.instanceId]?.neighbors.map(
                        (neighbor) => (
                          <div key={neighbor.id} className="text-neutral-300">
                            Neighbor: {neighbor.id} - Cost: {neighbor.cost}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Network Topology Modal */}
      {showTopologyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-neutral-900 p-6 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-200">
                Network Topology
              </h2>
              <button
                onClick={() => setShowTopologyModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {devices
                .filter((d) => d.deviceType === "router")
                .map((router) => (
                  <div
                    key={router.instanceId}
                    className="bg-neutral-800 p-4 rounded"
                  >
                    <h3 className="text-lg font-medium text-neutral-200 mb-2">
                      {router.name}
                    </h3>
                    <div className="space-y-2">
                      {links
                        .filter(
                          (link) =>
                            link.from === router.instanceId ||
                            link.to === router.instanceId
                        )
                        .map((link) => (
                          <div
                            key={`${link.from}-${link.to}`}
                            className="text-neutral-300"
                          >
                            {link.from === router.instanceId
                              ? link.to
                              : link.from}{" "}
                            - Cost: {link.weight}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Routing Tables Modal */}
      {showRoutingTablesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-neutral-900 p-6 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-200">
                Routing Tables
              </h2>
              <button
                onClick={() => setShowRoutingTablesModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {devices
                .filter((d) => d.deviceType === "router")
                .map((router) => (
                  <div
                    key={router.instanceId}
                    className="bg-neutral-800 p-4 rounded"
                  >
                    <h3 className="text-lg font-medium text-neutral-200 mb-2">
                      {router.name}
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(
                        routingTables[router.instanceId] || {}
                      ).map(([destination, route]) => (
                        <div key={destination} className="text-neutral-300">
                          Destination: {destination} - Next Hop: {route.nextHop}{" "}
                          - Cost: {route.cost}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <NetworkLogModal
        isOpen={isNetworkLogOpen}
        onClose={() => setIsNetworkLogOpen(false)}
        logs={networkEvents.map((event) => {
          const timestamp = event.timestamp.toLocaleTimeString();
          switch (event.type) {
            case "node_added":
              return `[${timestamp}] Node ${event.details.nodeId} added at position (${event.details.position?.x}, ${event.details.position?.y})`;
            case "node_moved":
              return `[${timestamp}] Node ${event.details.nodeId} moved to position (${event.details.position?.x}, ${event.details.position?.y})`;
            case "link_created":
              return `[${timestamp}] Link created between ${event.details.fromNode} and ${event.details.toNode}`;
            case "packet_sent":
              return `[${timestamp}] Packet ${event.details.packetId} sent from ${event.details.fromNode} to ${event.details.toNode}`;
            case "node_removed":
              return `[${timestamp}] Node ${event.details.nodeId} removed`;
            default:
              return `[${timestamp}] Unknown event`;
          }
        })}
      />

      {/* Delete Confirmation Modal */}
      {deviceToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-neutral-900 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-200">
                Delete Device
              </h2>
              <button
                onClick={() => setDeviceToDelete(null)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-300 mb-4">
              Are you sure you want to delete this device? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeviceToDelete(null)}
                className="px-4 py-2 text-neutral-200 hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDevice(deviceToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
