// App.tsx
import { useState, useEffect } from 'react';
import { Router, MonitorSmartphone, HardDrive } from 'lucide-react';
import { Device, DeviceInstance, Link, RoutingTable } from './types';
import Canvas from './components/Canvas';
import Palette from './components/Palette';

function App() {
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [routingTables, setRoutingTables] = useState<Record<string, RoutingTable>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [animations, setAnimations] = useState<
    { from: string; to: string; id: number }[]
  >([]);

  const availableDevices: Device[] = [
    { id: 'router', icon: Router, color: 'bg-blue-500', type: 'router' },
    { id: 'pc', icon: MonitorSmartphone, color: 'bg-green-500', type: 'pc' },
    { id: 'switch', icon: HardDrive, color: 'bg-purple-500', type: 'switch' },
  ];

  const [routerCount, setRouterCount] = useState(0);
  const [pcCount, setPcCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);

  const handleDrop = (device: Device, x: number, y: number) => {
    let instanceId = '';
    if (device.type === 'router') instanceId = `R${routerCount + 1}`;
    if (device.type === 'pc') instanceId = `P${pcCount + 1}`;
    if (device.type === 'switch') instanceId = `S${switchCount + 1}`;

    const newDevice: DeviceInstance = {
      ...device,
      instanceId,
      position: { x, y },
    };

    setDevices((prev) => [...prev, newDevice]);
    if (device.type === 'router') setRouterCount((c) => c + 1);
    if (device.type === 'pc') setPcCount((c) => c + 1);
    if (device.type === 'switch') setSwitchCount((c) => c + 1);
  };

  const handleMove = (instanceId: string, x: number, y: number) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.instanceId === instanceId ? { ...device, position: { x, y } } : device
      )
    );
  };

  const buildAdjacencyList = (): Record<string, string[]> => {
    const adj: Record<string, string[]> = {};
    devices.forEach((d) => (adj[d.instanceId] = []));
    links.forEach(({ from, to }) => {
      adj[from].push(to);
      adj[to].push(from);
    });
    return adj;
  };

  const computeRoutingTables = () => {
    const adjList = buildAdjacencyList();
    const tables: Record<string, RoutingTable> = {};

    for (const startNode of Object.keys(adjList)) {
      const visited = new Set<string>();
      const queue: { node: string; hops: number; path: string[] }[] = [
        { node: startNode, hops: 0, path: [startNode] },
      ];
      const table: RoutingTable = {};

      while (queue.length) {
        const { node, hops, path } = queue.shift()!;
        if (visited.has(node)) continue;
        visited.add(node);

        if (node !== startNode) {
          table[node] = {
            nextHop: path[1],
            hops,
          };
        }

        for (const neighbor of adjList[node]) {
          if (!visited.has(neighbor)) {
            queue.push({ node: neighbor, hops: hops + 1, path: [...path, neighbor] });
          }
        }
      }

      tables[startNode] = table;
    }

    setRoutingTables(tables);
  };

  useEffect(() => {
    if (devices.length > 0) {
      computeRoutingTables();
    }
  }, [devices, links]);

  const floodHelloPacketsFrom = (startNode: string) => {
    const adjList = buildAdjacencyList();
    const visitedNodes = new Set<string>();
    visitedNodes.add(startNode);
  
    let wave: string[] = [startNode];
    let idCounter = 0;
  
    const propagateWave = (currentWave: string[]) => {
      const nextWave: string[] = [];
      const newAnimations: { from: string; to: string; id: number }[] = [];
  
      for (const from of currentWave) {
        for (const to of adjList[from]) {
          if (!visitedNodes.has(to)) {
            visitedNodes.add(to);
            nextWave.push(to);
            newAnimations.push({ from, to, id: idCounter++ });
          }
        }
      }
  
      if (newAnimations.length > 0) {
        setAnimations(newAnimations);
  
        // Wait for animations to finish before starting the next wave
        setTimeout(() => {
          propagateWave(nextWave);
        }, 1200); // must match or exceed the animation time (see Canvas)
      }
    };
  
    propagateWave(wave);
  };
  
  

  return (
    <div className="flex min-h-screen bg-pattern">
      <Palette
        devices={availableDevices}
        routingTables={routingTables}
        devicesOnCanvas={devices}
      />

      <div className="flex flex-col w-full p-8 pt-0 mx-auto">
        <div className="text-white flex items-center justify-center h-16 gap-4">
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="bg-black border border-white rounded-md p-2"
          >
            Reset Canvas
          </button>
          <button
            onClick={() => {
              if (selected) {
                floodHelloPacketsFrom(selected);
              } else {
                alert('Select a node first!');
              }
            }}
            className="bg-black border border-white rounded-md p-2"
          >
            Show Hello packets for selected node
          </button>
        </div>
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
      </div>
    </div>
  );
}

export default App;
