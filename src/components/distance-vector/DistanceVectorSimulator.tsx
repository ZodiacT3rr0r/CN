// App.tsx
import { useState, useEffect } from "react";
import { Link } from "../../types";
import Canvas from "../Canvas";
import Palette from "../Palette";
import RoutingPanel from "./RoutingPanel";
import NetworkLogModal from "../NetworkLogModal";
import ImportExportButtons from "../ImportExportButtons";
import DeleteConfirmationModal from "../DeleteConfirmationModal";
import { useDevices } from "../../hooks/useDevices";
import { useNetworkEvents } from "../../hooks/useNetworkEvents";
import { useRouting } from "../../hooks/useRouting";

function DistanceVectorSimulator() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [animations, setAnimations] = useState<
    { from: string; to: string; id: number; type: "hello" | "dv" }[]
  >([]);

  const {
    devices,
    setDevices,
    selected,
    setSelected,
    availableDevices,
    handleDrop,
    handleMove,
    handleDelete,
    resetDevices,
  } = useDevices();

  const {
    networkEvents,
    isNetworkLogOpen,
    setIsNetworkLogOpen,
    addNetworkEvent,
    clearNetworkEvents,
    formatNetworkEvent,
  } = useNetworkEvents();

  const { routingTables, distanceVectors, buildAdjacencyList } = useRouting(
    devices,
    links
  );

  const handleReset = () => {
    resetDevices();
    setLinks([]);
    clearNetworkEvents();
    setAnimations([]);
  };

  const handleShowHelloPackets = () => {
    if (!selected) {
      alert("Select a node first!");
      return;
    }

    const adjList = buildAdjacencyList();
    const visitedNodes = new Set<string>();
    visitedNodes.add(selected);

    let wave: string[] = [selected];
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
            addNetworkEvent({
              type: "packet_sent",
              details: {
                fromNode: from,
                toNode: to,
                packetId: idCounter,
              },
            });
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

  const handleExport = () => {
    const state = {
      devices,
      links,
      networkEvents,
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
      if (!state.devices || !Array.isArray(state.devices))
        throw new Error("Invalid devices data");
      if (!state.links || !Array.isArray(state.links))
        throw new Error("Invalid links data");
      if (!state.networkEvents || !Array.isArray(state.networkEvents))
        throw new Error("Invalid network events data");

      setDevices(state.devices);
      setLinks(state.links);
      clearNetworkEvents();
      setSelected(null);
      setAnimations([]);
    } catch (error) {
      console.error("Import error:", error);
      alert(
        `Failed to import network state: ${
          error instanceof Error ? error.message : "Invalid file format"
        }`
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        setDeviceToDelete(selected);
        setIsDeleteModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  return (
    <div className="flex flex-col h-screen bg-pattern">
      <Palette
        devices={availableDevices}
        routingTables={routingTables}
        devicesOnCanvas={devices}
        onReset={handleReset}
        onShowHelloPackets={handleShowHelloPackets}
        onShowNetworkLog={() => setIsNetworkLogOpen(true)}
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
            onDrop={(device, x, y) => handleDrop(device, x, y, addNetworkEvent)}
            onMove={(id, x, y) => handleMove(id, x, y, addNetworkEvent)}
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
        logs={networkEvents.map(formatNetworkEvent)}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (deviceToDelete) {
            handleDelete(deviceToDelete, addNetworkEvent);
            setIsDeleteModalOpen(false);
            setDeviceToDelete(null);
          }
        }}
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
