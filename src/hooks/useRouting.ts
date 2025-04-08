import { useState, useEffect } from 'react';
import { DeviceInstance, Link, RoutingTable, DistanceVector, RoutingUpdate } from '../types';

export const useRouting = (devices: DeviceInstance[], links: Link[]) => {
  const [routingTables, setRoutingTables] = useState<Record<string, RoutingTable>>({});
  const [distanceVectors, setDistanceVectors] = useState<{ [key: string]: DistanceVector }>({});

  const buildAdjacencyList = (): Record<string, { node: string; weight: number }[]> => {
    const adj: Record<string, { node: string; weight: number }[]> = {};
    devices.forEach((d) => (adj[d.instanceId] = []));
    links.forEach(({ from, to, weight }) => {
      adj[from].push({ node: to, weight });
      adj[to].push({ node: from, weight });
    });
    return adj;
  };

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
      if (devices.find((d) => d.instanceId === neighbor)?.deviceType !== "router")
        return;

      const link = links.find(
        (l) =>
          (l.from === from && l.to === neighbor) ||
          (l.from === neighbor && l.to === from)
      );
      if (!link) return;

      // Initialize distance vector for neighbor if it doesn't exist
      if (!newDistanceVectors[neighbor]) {
        newDistanceVectors[neighbor] = {};
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

  const computeRoutingTables = (currentDVs: { [key: string]: DistanceVector }) => {
    const newRoutingTables: Record<string, RoutingTable> = {};
    const newDistanceVectors = { ...currentDVs };
    let hasChanges = true;

    // Initialize routing tables for each router
    devices
      .filter((d) => d.deviceType === "router")
      .forEach((router) => {
        const routerId = router.instanceId;
        newRoutingTables[routerId] = {};
        newDistanceVectors[routerId] = { [routerId]: 0 }; // Cost to self is always 0
      });

    // Keep processing updates until no more changes
    while (hasChanges) {
      hasChanges = false;
      devices
        .filter((d) => d.deviceType === "router")
        .forEach((router) => {
          const routerId = router.instanceId;
          const update: RoutingUpdate = {
            from: routerId,
            distanceVector: newDistanceVectors[routerId],
            timestamp: Date.now(),
          };
          if (processDistanceVector(update, newDistanceVectors, newRoutingTables)) {
            hasChanges = true;
          }
        });
    }

    setRoutingTables(newRoutingTables);
    setDistanceVectors(newDistanceVectors);
  };

  // Initialize distance vectors when devices or links change
  useEffect(() => {
    if (devices.length > 0) {
      const newDVs = initializeDistanceVectors(devices);
      setDistanceVectors(newDVs);
      computeRoutingTables(newDVs);
    }
  }, [devices, links]);

  const resetRouting = () => {
    setRoutingTables({});
    setDistanceVectors({});
  };

  return {
    routingTables,
    setRoutingTables,
    distanceVectors,
    setDistanceVectors,
    buildAdjacencyList,
    computeRoutingTables,
    resetRouting
  };
}; 