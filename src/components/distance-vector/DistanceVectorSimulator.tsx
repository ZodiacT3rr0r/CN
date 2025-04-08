// App.tsx
import { useState, useEffect } from "react";
import { Router } from "lucide-react";
import {
  Device,
  DeviceInstance,
  Link,
  RoutingTable,
  DistanceVector,
  NetworkEvent,
  LinkState,
} from "../../types";
import Canvas from "../Canvas";
import Palette from "../Palette";
import RoutingPanel from "./RoutingPanel";
import NetworkLogModal from "../NetworkLogModal";
import ImportExportButtons from "../ImportExportButtons";
import DeleteConfirmationModal from "../DeleteConfirmationModal";
import { useDevices } from "../../hooks/useDevices";
import { useNetworkEvents } from "../../hooks/useNetworkEvents";
import { useRouting } from "../../hooks/useRouting";

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
  const [links, setLinks] = useState<Link[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [history, setHistory] = useState<NetworkState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [pendingHistoryAction, setPendingHistoryAction] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [animatedPackets, setAnimatedPackets] = useState<Array<{
    id: number;
    from: string;
    to: string;
    type: "hello" | "dv" | "lsp";
    lspData?: LinkState;
    start: { x: number; y: number };
    end: { x: number; y: number };
    progress: number;
  }>>([]);

  const availableDevices: Device[] = [
    { id: "router", icon: Router, color: "bg-blue-500", type: "router" },
  ];

  const {
    devices,
    routerCount,
    pcCount,
    switchCount,
    handleDrop: handleDeviceDrop,
    handleMove,
    handleDelete: handleDeviceDelete,
    resetDevices,
    setDevices,
    setRouterCount,
    setPcCount,
    setSwitchCount
  } = useDevices();

  const {
    networkEvents,
    animations,
    setAnimations,
    setNetworkEvents,
    addNetworkEvent,
    handlePacketSent,
    handleLinkCreated,
    resetNetworkEvents
  } = useNetworkEvents();

  const {
    routingTables,
    distanceVectors,
    setRoutingTables,
    setDistanceVectors,
    buildAdjacencyList,
    computeRoutingTables,
    resetRouting
  } = useRouting(devices, links);

  const handleDrop = (device: Device, x: number, y: number) => {
    const { instanceId, action } = handleDeviceDrop(device, x, y);
    
    // Add network event
    addNetworkEvent({
      type: "node_added",
      details: {
        nodeId: instanceId,
        position: { x, y },
      },
    });

    // Set pending history action
    setPendingHistoryAction(action);
  };

  const handleDeleteConfirm = () => {
    if (!deviceToDelete) return;

    const result = handleDeviceDelete(deviceToDelete);
    if (!result) return;

    // Clear selection
    setSelected(null);

    // Add network event
    addNetworkEvent({
      type: "node_removed",
      details: {
        nodeId: deviceToDelete,
      },
    });

    // Remove all links connected to this device
    setLinks((prev) =>
      prev.filter(
        (link) => link.from !== deviceToDelete && link.to !== deviceToDelete
      )
    );

    setDeviceToDelete(null);

    // Set pending history action
    setPendingHistoryAction(result.action);
  };

  const handleReset = () => {
    setLinks([]);
    setSelected(null);
    resetDevices();
    resetNetworkEvents();
    resetRouting();
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

  // Effect to save to history after state updates
  useEffect(() => {
    if (pendingHistoryAction) {
      saveToHistory(pendingHistoryAction);
      setPendingHistoryAction(null);
    }
  }, [devices, links, pendingHistoryAction]);

  // Add this useEffect for handling animations
  useEffect(() => {
    if (animations.length === 0) {
      return;
    }

    const newPackets = animations
      .map(({ from, to, id, type, lspData }) => {
        const fromDevice = devices.find((d) => d.instanceId === from);
        const toDevice = devices.find((d) => d.instanceId === to);
        if (!fromDevice || !toDevice) return null;

        return {
          id,
          from,
          to,
          type,
          lspData,
          start: fromDevice.position,
          end: toDevice.position,
          progress: 0,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    setAnimatedPackets(prev => [...prev, ...newPackets]);

    const interval = setInterval(() => {
      setAnimatedPackets((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            progress: p.progress + 0.02,
          }))
          .filter((p) => p.progress <= 1);

        if (next.length === 0) {
          clearInterval(interval);
          if (animations.length > 0) {
            setAnimations([]);
          }
        }

        return next;
      });
    }, 8);

    return () => clearInterval(interval);
  }, [animations, devices, setAnimations]);

  const handleSimulationStep = () => {
    if (simulationStep >= 0) {
      // Get the next state from history
      const nextState = history[simulationStep + 1];
      if (nextState) {
        setDevices(nextState.devices);
        setLinks(nextState.links);
        setRoutingTables(nextState.routingTables);
        setDistanceVectors(nextState.distanceVectors);
        setNetworkEvents(nextState.networkEvents);
        setRouterCount(nextState.routerCount);
        setPcCount(nextState.pcCount);
        setSwitchCount(nextState.switchCount);
        setSimulationStep(prev => prev + 1);
      }
    }
  };

  const handleSimulationStart = () => {
    setIsSimulationRunning(true);
    // Start from the beginning of the simulation
    setSimulationStep(0);
  };

  const handleSimulationStop = () => {
    setIsSimulationRunning(false);
  };

  const handleSimulationReset = () => {
    setIsSimulationRunning(false);
    setSimulationStep(0);
    // Reset to the first state in history
    if (history.length > 0) {
      const firstState = history[0];
      setDevices(firstState.devices);
      setLinks(firstState.links);
      setRoutingTables(firstState.routingTables);
      setDistanceVectors(firstState.distanceVectors);
      setNetworkEvents(firstState.networkEvents);
      setRouterCount(firstState.routerCount);
      setPcCount(firstState.pcCount);
      setSwitchCount(firstState.switchCount);
    }
  };

  // Effect to check for convergence
  useEffect(() => {
    if (routingTables && Object.keys(routingTables).length > 0) {
      // Check if any routing table has changed in the last step
      const hasChanges = Object.entries(routingTables).some(([routerId, table]) => {
        const previousTable = history[simulationStep]?.routingTables[routerId];
        return JSON.stringify(table) !== JSON.stringify(previousTable);
      });
      setIsConverged(!hasChanges);
    }
  }, [routingTables, simulationStep, history]);

  // Effect to handle automatic simulation steps
  useEffect(() => {
    if (isSimulationRunning && !isConverged) {
      const timer = setTimeout(() => {
        handleSimulationStep();
      }, 2000); // Step every 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isSimulationRunning, simulationStep, isConverged]);

  return (
    <div className="flex flex-col h-screen bg-pattern">
      <Palette
        devices={availableDevices}
        onReset={handleReset}
        onShowHelloPackets={handleShowHelloPackets}
        onShowNetworkLog={handleShowNetworkLog}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={currentHistoryIndex >= 0}
        canRedo={currentHistoryIndex < history.length - 1}
        onLSPFlooding={() => alert("LSP Flooding is only available in Link State Routing")}
        isLSPFlooding={false}
        simulatorType="distance-vector"
        onSimulationStart={handleSimulationStart}
        onSimulationStop={handleSimulationStop}
        onSimulationReset={handleSimulationReset}
        onSimulationStep={handleSimulationStep}
        isSimulationRunning={isSimulationRunning}
        isConverged={isConverged}
      />

      <div className="flex flex-1 overflow-hidden">
        <RoutingPanel
          devices={devices}
          links={links}
          selected={selected}
          onSelect={setSelected}
          routingTables={routingTables}
        />

        <div className="flex-1 p-8 overflow-hidden relative">
          <Canvas
            devices={devices}
            availableDevices={availableDevices}
            links={links}
            setLinks={(newLinks: Link[] | ((prev: Link[]) => Link[])) => {
              const updatedLinks = typeof newLinks === 'function' ? newLinks(links) : newLinks;
              setLinks(updatedLinks);
              if (updatedLinks.length !== links.length) {
                setPendingHistoryAction(`link_${updatedLinks.length > links.length ? 'add' : 'remove'}`);
                if (updatedLinks.length > links.length) {
                  const lastLink = updatedLinks[updatedLinks.length - 1];
                  handleLinkCreated(lastLink.from, lastLink.to);
                }
              }
            }}
            selected={selected}
            setSelected={setSelected}
            onDrop={handleDrop}
            onMove={handleMove}
            animatedPackets={animatedPackets}
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
