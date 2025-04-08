// components/Canvas.tsx
import React, { useState, useRef, useEffect } from "react";
import { Device, DeviceInstance, Link } from "../types";
import { Mail } from "lucide-react";
import EdgeWeightModal from "./EdgeWeightModal";

interface CanvasProps {
  devices: DeviceInstance[];
  availableDevices: Device[];
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  selected: string | null;
  setSelected: (id: string | null) => void;
  onDrop: (device: Device, x: number, y: number) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  animations: { from: string; to: string; id: number; type: "hello" | "dv" }[];
  setAnimations: React.Dispatch<
    React.SetStateAction<
      { from: string; to: string; id: number; type: "hello" | "dv" }[]
    >
  >;
}

function Canvas({
  devices,
  availableDevices,
  links,
  setLinks,
  selected,
  setSelected,
  onDrop,
  onMove,
  animations,
  setAnimations,
}: CanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const wasDraggingRef = useRef(false);
  const [animatedPackets, setAnimatedPackets] = useState<any[]>([]);
  const [edgeWeightModal, setEdgeWeightModal] = useState<{
    isOpen: boolean;
    from: string;
    to: string;
    currentWeight?: number;
  }>({
    isOpen: false,
    from: "",
    to: "",
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const deviceId = e.dataTransfer.getData("deviceId");
    const device = availableDevices.find((s) => s.id === deviceId);
    if (!device) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onDrop(device, x, y);
  };

  const handleMouseDown = (e: React.MouseEvent, instanceId: string) => {
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    setDraggingId(instanceId);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Add smooth transition class
    element.classList.add("transition-none");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    wasDraggingRef.current = true;
    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - canvasRect.left - offset.x + 32;
    const y = e.clientY - canvasRect.top - offset.y + 32;

    // Update position directly
    const draggedElement = document.querySelector(
      `[data-instance-id="${draggingId}"]`
    ) as HTMLElement;
    if (draggedElement) {
      draggedElement.style.left = `${x - 32}px`;
      draggedElement.style.top = `${y - 32}px`;
    }

    // Still update the state for other components
    onMove(draggingId, x, y);
  };

  const handleMouseUp = () => {
    if (draggingId) {
      // Remove smooth transition class
      const draggedElement = document.querySelector(
        `[data-instance-id="${draggingId}"]`
      ) as HTMLElement;
      if (draggedElement) {
        draggedElement.classList.remove("transition-none");
      }
    }
    setDraggingId(null);
    setTimeout(() => (wasDraggingRef.current = false), 0);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === "canvas") {
      setSelected(null);
    }
  };

  const handleDeviceClick = (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wasDraggingRef.current) return;

    if (selected && selected !== instanceId) {
      const existingLinkIndex = links.findIndex(
        (link) =>
          (link.from === selected && link.to === instanceId) ||
          (link.from === instanceId && link.to === selected)
      );

      if (existingLinkIndex !== -1) {
        setEdgeWeightModal({
          isOpen: true,
          from: links[existingLinkIndex].from,
          to: links[existingLinkIndex].to,
          currentWeight: links[existingLinkIndex].weight,
        });
      } else {
        setEdgeWeightModal({
          isOpen: true,
          from: selected,
          to: instanceId,
        });
      }

      setSelected(null);
    } else {
      setSelected(instanceId);
    }
  };

  const handleEdgeWeightSubmit = (weight: number) => {
    const existingLinkIndex = links.findIndex(
      (link) =>
        (link.from === edgeWeightModal.from &&
          link.to === edgeWeightModal.to) ||
        (link.from === edgeWeightModal.to && link.to === edgeWeightModal.from)
    );

    if (existingLinkIndex !== -1) {
      // Update existing link weight
      setLinks((prev) =>
        prev.map((link, index) =>
          index === existingLinkIndex ? { ...link, weight } : link
        )
      );
    } else {
      // Add new link with weight
      setLinks((prev) => [
        ...prev,
        {
          from: edgeWeightModal.from,
          to: edgeWeightModal.to,
          weight,
        },
      ]);
    }
  };

  const handleRemoveEdge = () => {
    const existingLinkIndex = links.findIndex(
      (link) =>
        (link.from === edgeWeightModal.from &&
          link.to === edgeWeightModal.to) ||
        (link.from === edgeWeightModal.to && link.to === edgeWeightModal.from)
    );

    if (existingLinkIndex !== -1) {
      setLinks((prev) =>
        prev.filter((_, index) => index !== existingLinkIndex)
      );
    }
  };

  // Animate hello packet movement
  useEffect(() => {
    if (animations.length === 0) return;

    const packets = animations
      .map(({ from, to, id }) => {
        const fromDevice = devices.find((d) => d.instanceId === from);
        const toDevice = devices.find((d) => d.instanceId === to);
        if (!fromDevice || !toDevice) return null;

        return {
          id,
          from,
          to,
          start: fromDevice.position,
          end: toDevice.position,
          progress: 0,
        };
      })
      .filter(Boolean);

    setAnimatedPackets(packets);

    const interval = setInterval(() => {
      setAnimatedPackets((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            progress: p.progress + 0.01, // adjust this for smoother/slower
          }))
          .filter((p) => p.progress <= 1); // ensure packet fully reaches

        if (next.length === 0) {
          clearInterval(interval);
          setAnimations([]); // signal App to continue to next wave
        }

        return next;
      });
    }, 20); // slower interval = smoother animation

    return () => clearInterval(interval);
  }, [animations]);

  return (
    <>
      <div
        id="canvas"
        className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg w-full h-full relative overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg className="absolute w-full h-full pointer-events-none">
          <defs>
            {/* Add pulse animation definition */}
            <filter id="pulse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="2"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="glow"
              />
              <feBlend in="SourceGraphic" in2="glow" mode="normal" />
            </filter>
            <animate
              xlinkHref="#pulse"
              attributeName="stdDeviation"
              from="2"
              to="4"
              dur="1s"
              repeatCount="indefinite"
            />
          </defs>

          {/* Render static links */}
          {links.map((link, index) => {
            const from = devices.find((d) => d.instanceId === link.from);
            const to = devices.find((d) => d.instanceId === link.to);
            if (!from || !to) return null;

            const midX = (from.position.x + to.position.x) / 2;
            const midY = (from.position.y + to.position.y) / 2;

            return (
              <g key={index}>
                <line
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                  stroke="rgb(250 250 250)"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  className="text-neutral-50 text-xs font-medium select-none"
                  fill="rgb(250 250 250)"
                  style={{ userSelect: "none" }}
                >
                  {link.weight}
                </text>
              </g>
            );
          })}

          {/* Marker for arrows */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="rgb(250 250 250)"
                fillOpacity={0.5}
              />
            </marker>
          </defs>

          {/* Render animated packets */}
          {animations.map(({ from, to, id, type }) => {
            const fromDevice = devices.find((d) => d.instanceId === from);
            const toDevice = devices.find((d) => d.instanceId === to);

            if (!fromDevice || !toDevice) return null;

            const x1 = fromDevice.position.x;
            const y1 = fromDevice.position.y;
            const x2 = toDevice.position.x;
            const y2 = toDevice.position.y;

            if (type === "dv") {
              // Pulse animation for Distance Vector updates
              return (
                <g key={id}>
                  <circle
                    cx={(x1 + x2) / 2}
                    cy={(y1 + y2) / 2}
                    r="8"
                    className="fill-blue-500/50"
                    filter="url(#pulse)"
                  >
                    <animate
                      attributeName="r"
                      from="8"
                      to="16"
                      dur="1s"
                      begin="0s"
                      repeatCount="1"
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="1s"
                      begin="0s"
                      repeatCount="1"
                    />
                  </circle>
                </g>
              );
            }

            // Default packet animation for Hello packets
            return (
              <circle
                key={id}
                cx={x1}
                cy={y1}
                r="4"
                className="fill-yellow-500"
              >
                <animate
                  attributeName="cx"
                  from={x1}
                  to={x2}
                  dur="1s"
                  begin="0s"
                  fill="freeze"
                />
                <animate
                  attributeName="cy"
                  from={y1}
                  to={y2}
                  dur="1s"
                  begin="0s"
                  fill="freeze"
                />
              </circle>
            );
          })}
        </svg>

        {/* Device nodes */}
        {devices.map((device) => {
          const isSelected = selected === device.instanceId;
          return (
            <div
              key={device.instanceId}
              data-instance-id={device.instanceId}
              className={`
                absolute 
                ${device.color} 
                w-16 h-16 
                rounded-xl
                flex flex-col items-center justify-center 
                cursor-move 
                border-2 
                transition-all duration-200
                select-none
                ${
                  isSelected
                    ? "border-neutral-50 ring-2 ring-neutral-50/50"
                    : "border-neutral-800"
                }
                shadow-lg hover:shadow-xl
              `}
              style={{
                left: device.position.x - 32,
                top: device.position.y - 32,
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
              onMouseDown={(e) => handleMouseDown(e, device.instanceId)}
              onClick={(e) => handleDeviceClick(device.instanceId, e)}
            >
              {React.createElement(device.icon, {
                className: `w-8 h-8 z-40 ${
                  isSelected ? "text-neutral-50" : "text-neutral-50/80"
                }`,
              })}
              <span className="text-neutral-50/80 text-xs mt-1 font-medium select-none">
                {device.instanceId}
              </span>
            </div>
          );
        })}
      </div>

      <EdgeWeightModal
        isOpen={edgeWeightModal.isOpen}
        onClose={() => setEdgeWeightModal({ isOpen: false, from: "", to: "" })}
        onSubmit={handleEdgeWeightSubmit}
        onRemove={handleRemoveEdge}
        fromNode={edgeWeightModal.from}
        toNode={edgeWeightModal.to}
        currentWeight={edgeWeightModal.currentWeight}
      />
    </>
  );
}

export default Canvas;
