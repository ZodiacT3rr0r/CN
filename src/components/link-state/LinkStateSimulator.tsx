import { useState, useEffect } from "react";
import { Router } from "lucide-react";
import {
  Device,
  Link,
  LinkStateNetworkState,
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
import { useLinkStateRouting } from "../../hooks/useLinkStateRouting";

function LinkStateSimulator() {
  const [links, setLinks] = useState<Link[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [history, setHistory] = useState<LinkStateNetworkState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [pendingHistoryAction, setPendingHistoryAction] = useState<string | null>(null);
  const [lastLSPSequence, setLastLSPSequence] = useState<Record<string, number>>({});
  const [isLSPFlooding, setIsLSPFlooding] = useState(false);
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
    handleDrop: handleDeviceDrop,
    handleMove,
    handleDelete: handleDeviceDelete,
    resetDevices,
    setDevices,
    setRouterCount
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
    linkStates,
    routingTables,
    updateLinkStates,
    resetRouting,
    buildAdjacencyList
  } = useLinkStateRouting(devices, links);

  const handleDrop = (device: Device, x: number, y: number) => {
    const { instanceId, action } = handleDeviceDrop(device, x, y);
    
    addNetworkEvent({
      type: "node_added",
      details: {
        nodeId: instanceId,
        position: { x, y },
      },
    });

    setPendingHistoryAction(action);
  };

  const handleDeleteConfirm = () => {
    if (!deviceToDelete) return;

    const result = handleDeviceDelete(deviceToDelete);
    if (!result) return;

    setSelected(null);

    addNetworkEvent({
      type: "node_removed",
      details: {
        nodeId: deviceToDelete,
      },
    });

    setLinks((prev) =>
      prev.filter(
        (link) => link.from !== deviceToDelete && link.to !== deviceToDelete
      )
    );

    setDeviceToDelete(null);
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
    if (isLSPFlooding) return; // Prevent sending hello packets during LSP flooding
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

      state.links.forEach((link: any) => {
        if (!link.from || !link.to || typeof link.weight !== "number") {
          throw new Error("Invalid link properties");
        }
      });

      setDevices([]);
      setLinks([]);
      setNetworkEvents([]);
      setSelected(null);
      setAnimations([]);

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

      setDevices(restoredDevices);
      setLinks(state.links);
      setNetworkEvents(state.networkEvents);
      setRouterCount(state.routerCount);

      setTimeout(() => {
        updateLinkStates();
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

  const handleLSPFlooding = () => {
    if (isLSPFlooding) return; // Only prevent multiple simultaneous floodings
    
    setIsLSPFlooding(true);

    // First send hello packets to establish neighbor relationships
    const sendHelloPackets = async () => {
      for (const device of devices) {
        if (device.deviceType === "router") {
          await new Promise<void>(resolve => {
            floodHelloPacketsFrom(device.instanceId);
            setTimeout(resolve, 2000); // Wait for hello packets to complete
          });
        }
      }
    };

    // Then start LSP flooding
    const startLSPFlooding = async () => {
      for (const device of devices) {
        if (device.deviceType === "router") {
          const lspData: LinkState = {
            nodeId: device.instanceId,
            neighbors: {},
            sequenceNumber: (lastLSPSequence[device.instanceId] || 0) + 1,
            timestamp: Date.now()
          };

          // Add neighbors based on links
          links.forEach(link => {
            if (link.from === device.instanceId) {
              lspData.neighbors[link.to] = link.weight;
            } else if (link.to === device.instanceId) {
              lspData.neighbors[link.from] = link.weight;
            }
          });

          // Update sequence number
          setLastLSPSequence(prev => ({
            ...prev,
            [device.instanceId]: lspData.sequenceNumber
          }));

          // Start flooding from this router
          await new Promise<void>(resolve => {
            floodLSP(device.instanceId, lspData);
            setTimeout(resolve, 2000); // Wait for LSP to complete
          });
        }
      }
    };

    // Execute the sequence
    sendHelloPackets()
      .then(() => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            startLSPFlooding().then(resolve);
          }, 500);
        });
      })
      .finally(() => {
        // Reset the flooding state after all operations complete
        setTimeout(() => {
          setIsLSPFlooding(false);
        }, 5000); // Add a small delay to ensure all animations complete
      });
  };

  const floodHelloPacketsFrom = (startNode: string) => {
    const adjList = buildAdjacencyList();
    const usedLinks = new Set<string>(); // track which links have been used
    const linkToPacketId = new Map<string, number>(); // map links to their packet IDs
    let idCounter = 0;

    // Get immediate neighbors from adjacency list
    const neighbors = adjList[startNode] || [];
    
    // Create animations for each immediate neighbor
    const newAnimations: {
      from: string;
      to: string;
      id: number;
      type: "hello";
    }[] = [];

    // Send hello packets to each immediate neighbor
    for (const { node: neighbor } of neighbors) {
      // Create a unique key for the link
      const linkKey = [startNode, neighbor].sort().join('-');
      if (usedLinks.has(linkKey)) continue; // don't use the same link twice
      
      // Get or create packet ID for this link
      let packetId = linkToPacketId.get(linkKey);
      if (packetId === undefined) {
        packetId = idCounter++;
        linkToPacketId.set(linkKey, packetId);
      }
      
      // Send hello packet
      newAnimations.push({ from: startNode, to: neighbor, id: packetId, type: "hello" });
      handlePacketSent(startNode, neighbor, packetId);
      
      usedLinks.add(linkKey); // mark this link as used
    }

    // Add all animations at once
    if (newAnimations.length > 0) {
      setAnimations(prev => [...prev, ...newAnimations]);
    }
  };

  const floodLSP = (source: string, lspData: LinkState) => {
    const adjList = buildAdjacencyList();
    const visitedNodes = new Set<string>();
    visitedNodes.add(source);

    let wave: string[] = [source];
    let idCounter = 0;

    const propagateWave = (currentWave: string[]) => {
      const nextWave: string[] = [];
      const newAnimations: {
        from: string;
        to: string;
        id: number;
        type: "lsp";
        lspData: LinkState;
      }[] = [];

      for (const from of currentWave) {
        for (const { node: to } of adjList[from]) {
          if (!visitedNodes.has(to)) {
            visitedNodes.add(to);
            nextWave.push(to);
            newAnimations.push({
              from,
              to,
              id: idCounter,
              type: "lsp",
              lspData
            });
            handlePacketSent(from, to, idCounter);
            idCounter++;
          }
        }
      }

      if (newAnimations.length > 0) {
        setAnimations(prev => [...prev, ...newAnimations]);

        if (nextWave.length > 0) {
          setTimeout(() => propagateWave(nextWave), 600); // Reduced from 1200 to 600ms
        }
      }
    };

    propagateWave(wave);
  };

  const saveToHistory = (action: string) => {
    if (!action.startsWith('add_') && !action.startsWith('delete_') && !action.startsWith('link_')) {
      return;
    }

    if (currentHistoryIndex < history.length - 1) {
      setHistory((prev) => prev.slice(0, currentHistoryIndex + 1));
    }

    const currentState = {
      devices: [...devices],
      links: [...links],
      linkStates: { ...linkStates },
      routingTables: { ...routingTables },
      networkEvents: [...networkEvents],
      routerCount,
      action,
    };

    setHistory((prev) => [...prev, currentState]);
    setCurrentHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1];
      setDevices(previousState.devices);
      setLinks(previousState.links);
      setNetworkEvents(previousState.networkEvents);
      setRouterCount(previousState.routerCount);
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    } else if (currentHistoryIndex === 0) {
      setDevices([]);
      setLinks([]);
      setNetworkEvents([]);
      setRouterCount(0);
      setCurrentHistoryIndex(-1);
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setDevices(nextState.devices);
      setLinks(nextState.links);
      setNetworkEvents(nextState.networkEvents);
      setRouterCount(nextState.routerCount);
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

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

  useEffect(() => {
    if (pendingHistoryAction) {
      saveToHistory(pendingHistoryAction);
      setPendingHistoryAction(null);
    }
  }, [devices, links, pendingHistoryAction]);

  // Update link states when links change
  useEffect(() => {
    updateLinkStates();
  }, [links, devices, updateLinkStates]);

  // Update the useEffect that handles animations
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
        onLSPFlooding={handleLSPFlooding}
        isLSPFlooding={isLSPFlooding}
        simulatorType="link-state"
      />

      <div className="flex flex-1 overflow-hidden">
        <RoutingPanel
          devices={devices}
          links={links}
          selected={selected}
          onSelect={setSelected}
          routingTables={routingTables}
          linkStates={linkStates}
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

export default LinkStateSimulator;
