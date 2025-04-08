// App.tsx
import { useState, useEffect } from "react";
import { Router, MonitorSmartphone, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Device,
  DeviceInstance,
  Link,
  RoutingTable,
  DistanceVector,
  RoutingUpdate,
  NetworkEvent,
} from "../types";
import Canvas from "./Canvas";
import Palette from "./Palette";
import RoutingPanel from "./RoutingPanel";
import NetworkLogModal from "./NetworkLogModal";
import ImportExportButtons from "./ImportExportButtons";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface NetworkState {
  devices: DeviceInstance[];
  links: Link[];
  routingTables: Record<string, RoutingTable>;
  distanceVectors: { [key: string]: DistanceVector };
  networkEvents: NetworkEvent[];
  routerCount: number;
  pcCount: number;
  switchCount: number;
  action: string; // Description of what action caused this state
}

function DistanceVectorSimulator() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [routingTables, setRoutingTables] = useState<
    Record<string, RoutingTable>
  >({});
  const [selected, setSelected] = useState<string | null>(null);
  const [animations, setAnimations] = useState<
    { from: string; to: string; id: number; type: "hello" | "dv" }[]
  >([]);
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(false);
  const [distanceVectors, setDistanceVectors] = useState<{
    [key: string]: DistanceVector;
  }>({});
  const [isDvExchanging, setIsDvExchanging] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [history, setHistory] = useState<NetworkState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [pendingHistoryAction, setPendingHistoryAction] = useState<string | null>(null);

  const availableDevices: Device[] = [
    { id: "router", icon: Router, color: "bg-blue-500", type: "router" },
    { id: "pc", icon: MonitorSmartphone, color: "bg-green-500", type: "pc" },
    { id: "switch", icon: HardDrive, color: "bg-purple-500", type: "switch" },
  ];

  const [routerCount, setRouterCount] = useState(0);
  const [pcCount, setPcCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);

  const addNetworkEvent = (event: Omit<NetworkEvent, "id" | "timestamp">) => {
    setNetworkEvents((prev) => [
      ...prev,
      {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    ]);
  };

  const handleDrop = (device: Device, x: number, y: number) => {
    let instanceId = "";
    if (device.type === "router") instanceId = `R${routerCount + 1}`;
    if (device.type === "pc") instanceId = `P${pcCount + 1}`;
    if (device.type === "switch") instanceId = `S${switchCount + 1}`;

    const newDevice: DeviceInstance = {
      ...device,
      instanceId,
      deviceType: device.type,
      name: `${device.type.toUpperCase()}${instanceId.slice(1)}`,
      position: { x, y },
      interfaces: [],
    };

    // Update counts immediately
    if (device.type === "router") setRouterCount((c) => c + 1);
    if (device.type === "pc") setPcCount((c) => c + 1);
    if (device.type === "switch") setSwitchCount((c) => c + 1);

    // Add network event
    addNetworkEvent({
      type: "node_added",
      details: {
        nodeId: instanceId,
        position: { x, y },
      },
    });

    // Update devices state
    setDevices((prev) => [...prev, newDevice]);

    // Set pending history action
    setPendingHistoryAction(`add_${device.type}`);
  };

  const handleMove = (instanceId: string, x: number, y: number) => {
    setDevices((prev) => {
      const newDevices = prev.map((device) =>
        device.instanceId === instanceId
          ? { ...device, position: { x, y } }
          : device
      );

      // Add network event
      addNetworkEvent({
        type: "node_moved",
        details: {
          nodeId: instanceId,
          position: { x, y },
        },
      });

      return newDevices;
    });
  };

  const handleLinkCreated = (from: string, to: string) => {
    addNetworkEvent({
      type: "link_created",
      details: {
        fromNode: from,
        toNode: to,
      },
    });
    // Save link operation to history
    setPendingHistoryAction(`link_add_${from}_${to}`);
  };

  const handlePacketSent = (from: string, to: string, packetId: number) => {
    addNetworkEvent({
      type: "packet_sent",
      details: {
        fromNode: from,
        toNode: to,
        packetId,
      },
    });
  };

  const buildAdjacencyList = (): Record<
    string,
    { node: string; weight: number }[]
  > => {
    const adj: Record<string, { node: string; weight: number }[]> = {};
    devices.forEach((d) => (adj[d.instanceId] = []));
    links.forEach(({ from, to, weight }) => {
      adj[from].push({ node: to, weight });
      adj[to].push({ node: from, weight });
    });
    return adj;
  };

  const computeRoutingTables = (currentDVs: {
    [key: string]: DistanceVector;
  }) => {
    const newRoutingTables: Record<string, RoutingTable> = {};
    const newDistanceVectors = { ...currentDVs };

    // Initialize routing tables for each router
    devices
      .filter((d) => d.deviceType === "router")
      .forEach((router) => {
        const routerId = router.instanceId;
        newRoutingTables[routerId] = {};
        newDistanceVectors[routerId] = { [routerId]: 0 }; // Cost to self is always 0

        // Process initial updates from each router
        const initialUpdate: RoutingUpdate = {
          from: routerId,
          distanceVector: newDistanceVectors[routerId],
          timestamp: Date.now(),
        };
        processDistanceVector(
          initialUpdate,
          newDistanceVectors,
          newRoutingTables
        );
      });

    setRoutingTables(newRoutingTables);
    setDistanceVectors(newDistanceVectors);
  };

  useEffect(() => {
    if (devices.length > 0) {
      computeRoutingTables(distanceVectors);
    }
  }, [devices, links]);

  useEffect(() => {
    if (links.length > 0) {
      const lastLink = links[links.length - 1];
      handleLinkCreated(lastLink.from, lastLink.to);
    }
  }, [links]);

  const floodHelloPacketsFrom = (startNode: string) => {
    const adjList = buildAdjacencyList();
    const visitedNodes = new Set<string>();
    visitedNodes.add(startNode);

    let wave: string[] = [startNode];
    let idCounter = 0;

    const propagateWave = (currentWave: string[]) => {
      const nextWave: string[] = [];
      const newAnimations: {
        from: string;
        to: string;
        id: number;
        type: "hello";
      }[] = [];

      for (const from of currentWave) {
        for (const { node: to } of adjList[from]) {
          if (!visitedNodes.has(to)) {
            visitedNodes.add(to);
            nextWave.push(to);
            newAnimations.push({ from, to, id: idCounter, type: "hello" });
            handlePacketSent(from, to, idCounter);
            idCounter++;
          }
        }
      }

      if (newAnimations.length > 0) {
        setAnimations(newAnimations);

        setTimeout(() => {
          setAnimations([]);
          if (nextWave.length > 0) {
            propagateWave(nextWave);
          }
        }, 1200);
      }
    };

    propagateWave(wave);
  };

  const handleReset = () => {
    setDevices([]);
    setLinks([]);
    setRoutingTables({});
    setSelected(null);
    setAnimations([]);
    setNetworkEvents([]);
    setRouterCount(0);
    setPcCount(0);
    setSwitchCount(0);
    setHistory([]);
    setCurrentHistoryIndex(-1);
  };

  const handleShowHelloPackets = () => {
    if (selected) {
      floodHelloPacketsFrom(selected);
    } else {
      alert("Select a node first!");
    }
  };

  const handleShowNetworkLog = () => {
    setIsNetworkLogOpen(true);
  };

  const handleExport = () => {
    const state = {
      devices,
      links,
      networkEvents,
      routerCount,
      pcCount,
      switchCount,
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
      if (
        typeof state.routerCount !== "number" ||
        typeof state.pcCount !== "number" ||
        typeof state.switchCount !== "number"
      ) {
        throw new Error("Invalid device counts");
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
      setPcCount(state.pcCount);
      setSwitchCount(state.switchCount);

      // Recompute routing tables after state is updated
      setTimeout(() => {
        computeRoutingTables(distanceVectors);
      }, 0);
    } catch (error) {
      console.error("Import error:", error);
      alert(
        `Failed to import network state: ${
          error instanceof Error ? error.message : "Invalid file format"
        }`
      );
    }
  };

  // Initialize distance vectors when devices or links change
  useEffect(() => {
    if (devices.length > 0) {
      const newDVs = initializeDistanceVectors(devices);
      setDistanceVectors(newDVs);
      computeRoutingTables(newDVs);
    }
  }, [devices, links]);

  // Process distance vector updates immediately
  const processDistanceVector = (
    update: RoutingUpdate,
    newDistanceVectors: { [key: string]: DistanceVector },
    newRoutingTables: Record<string, RoutingTable>
  ) => {
    const { from, distanceVector } = update;
    let hasChanges = false;

    // Get all neighbors of the sender
    const neighbors = links
      .filter((l) => l.from === from || l.to === from)
      .map((l) => (l.from === from ? l.to : l.from));

    neighbors.forEach((neighbor) => {
      if (
        devices.find((d) => d.instanceId === neighbor)?.deviceType !== "router"
      )
        return;

      const link = links.find(
        (l) =>
          (l.from === from && l.to === neighbor) ||
          (l.from === neighbor && l.to === from)
      );
      if (!link) return;

      // Initialize distance vector for neighbor if it doesn't exist
      if (!newDistanceVectors[neighbor]) {
        newDistanceVectors[neighbor] = { [neighbor]: 0 }; // Cost to self is always 0
      }

      // Update distance vector using Bellman-Ford equation
      Object.entries(distanceVector).forEach(([dest, cost]) => {
        // Skip if trying to update cost to self
        if (dest === neighbor) return;

        const currentCost = newDistanceVectors[neighbor][dest] || Infinity;
        const newCost = link.weight + cost;

        if (newCost < currentCost) {
          newDistanceVectors[neighbor][dest] = newCost;

          // Update routing table
          if (!newRoutingTables[neighbor]) {
            newRoutingTables[neighbor] = {};
          }
          newRoutingTables[neighbor][dest] = {
            nextHop: from,
            cost: newCost,
          };

          hasChanges = true;

          // Queue an update from the neighbor that had changes
          const newUpdate: RoutingUpdate = {
            from: neighbor,
            distanceVector: { ...newDistanceVectors[neighbor] },
            timestamp: Date.now(),
          };
          processDistanceVector(
            newUpdate,
            newDistanceVectors,
            newRoutingTables
          );
        }
      });

      // Ensure cost to self is always 0
      newDistanceVectors[neighbor][neighbor] = 0;
      if (!newRoutingTables[neighbor]) {
        newRoutingTables[neighbor] = {};
      }
      newRoutingTables[neighbor][neighbor] = {
        nextHop: neighbor,
        cost: 0,
      };
    });

    return hasChanges;
  };

  // Initialize distance vectors when a new router is added
  const initializeDistanceVectors = (newDevices: DeviceInstance[]) => {
    const newDistanceVectors: { [key: string]: DistanceVector } = {};

    // For each router, initialize with infinity to all destinations except self
    newDevices
      .filter((d) => d.deviceType === "router")
      .forEach((router) => {
        const dv: DistanceVector = {};

        // Initialize all destinations to infinity
        newDevices
          .filter((d) => d.deviceType === "router")
          .forEach((dest) => {
            dv[dest.instanceId] = Infinity;
          });

        // Set distance to self as 0
        dv[router.instanceId] = 0;

        // Set direct neighbors based on links
        links.forEach((link) => {
          if (link.from === router.instanceId) {
            dv[link.to] = link.weight;
          } else if (link.to === router.instanceId) {
            dv[link.from] = link.weight;
          }
        });

        newDistanceVectors[router.instanceId] = dv;
      });

    return newDistanceVectors;
  };

  // Save current state to history
  const saveToHistory = (action: string) => {
    // Save history for node additions, removals, and link operations
    if (!action.startsWith('add_') && !action.startsWith('delete_') && !action.startsWith('link_')) {
      return;
    }

    // If we're not at the end of history, remove future states
    if (currentHistoryIndex < history.length - 1) {
      setHistory((prev) => prev.slice(0, currentHistoryIndex + 1));
    }

    const currentState = {
      devices: [...devices],
      links: [...links],
      routingTables: { ...routingTables },
      distanceVectors: { ...distanceVectors },
      networkEvents: [...networkEvents],
      routerCount,
      pcCount,
      switchCount,
      action,
    };

    // Add new state to history
    setHistory((prev) => [...prev, currentState]);
    setCurrentHistoryIndex((prev) => prev + 1);
  };

  // Handle undo
  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1];
      setDevices(previousState.devices);
      setLinks(previousState.links);
      setRoutingTables(previousState.routingTables);
      setDistanceVectors(previousState.distanceVectors);
      setNetworkEvents(previousState.networkEvents);
      setRouterCount(previousState.routerCount);
      setPcCount(previousState.pcCount);
      setSwitchCount(previousState.switchCount);
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    } else if (currentHistoryIndex === 0) {
      // Handle first undo - restore to empty state
      setDevices([]);
      setLinks([]);
      setRoutingTables({});
      setDistanceVectors({});
      setNetworkEvents([]);
      setRouterCount(0);
      setPcCount(0);
      setSwitchCount(0);
      setCurrentHistoryIndex(-1);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setDevices(nextState.devices);
      setLinks(nextState.links);
      setRoutingTables(nextState.routingTables);
      setDistanceVectors(nextState.distanceVectors);
      setNetworkEvents(nextState.networkEvents);
      setRouterCount(nextState.routerCount);
      setPcCount(nextState.pcCount);
      setSwitchCount(nextState.switchCount);
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const device = devices.find((d) => d.instanceId === selected);
        if (device) {
          setDeviceToDelete(selected);
          setIsDeleteModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, devices]);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!deviceToDelete) return;

    const deviceToDeleteObj = devices.find(
      (d) => d.instanceId === deviceToDelete
    );
    if (!deviceToDeleteObj) return;

    // Update device counts
    if (deviceToDeleteObj.deviceType === "router")
      setRouterCount((c) => c - 1);
    if (deviceToDeleteObj.deviceType === "pc") setPcCount((c) => c - 1);
    if (deviceToDeleteObj.deviceType === "switch")
      setSwitchCount((c) => c - 1);

    // Clear selection
    setSelected(null);

    // Add network event
    addNetworkEvent({
      type: "node_removed",
      details: {
        nodeId: deviceToDelete,
      },
    });

    // Update devices state
    setDevices((prev) => prev.filter((d) => d.instanceId !== deviceToDelete));

    // Remove all links connected to this device
    setLinks((prev) =>
      prev.filter(
        (link) => link.from !== deviceToDelete && link.to !== deviceToDelete
      )
    );

    setDeviceToDelete(null);

    // Set pending history action
    setPendingHistoryAction(`delete_${deviceToDelete}`);
  };

  // Effect to save to history after state updates
  useEffect(() => {
    if (pendingHistoryAction) {
      saveToHistory(pendingHistoryAction);
      setPendingHistoryAction(null);
    }
  }, [devices, links, pendingHistoryAction]);

  return (
    <div className="flex flex-col h-screen bg-pattern">
      <Palette
        devices={availableDevices}
        routingTables={routingTables}
        devicesOnCanvas={devices}
        onReset={handleReset}
        onShowHelloPackets={handleShowHelloPackets}
        onShowNetworkLog={handleShowNetworkLog}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={currentHistoryIndex >= 0}
        canRedo={currentHistoryIndex < history.length - 1}
      />

      <div className="flex flex-1 overflow-hidden">
        <RoutingPanel
          devices={devices}
          links={links}
          selected={selected}
          onSelect={setSelected}
          routingTables={routingTables}
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

      <NetworkLogModal
        isOpen={isNetworkLogOpen}
        onClose={() => setIsNetworkLogOpen(false)}
        events={networkEvents}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        deviceName={
          deviceToDelete
            ? devices.find((d) => d.instanceId === deviceToDelete)?.name || ""
            : ""
        }
      />
    </div>
  );
}

export default DistanceVectorSimulator;
