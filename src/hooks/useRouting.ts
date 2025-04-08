import { useState, useEffect } from "react";
import {
  DeviceInstance,
  Link,
  RoutingTable,
  DistanceVector,
  RoutingUpdate,
} from "../types";

export function useRouting(devices: DeviceInstance[], links: Link[]) {
  const [routingTables, setRoutingTables] = useState<
    Record<string, RoutingTable>
  >({});
  const [distanceVectors, setDistanceVectors] = useState<{
    [key: string]: DistanceVector;
  }>({});

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

  const initializeDistanceVectors = (devices: DeviceInstance[]) => {
    const newDistanceVectors: { [key: string]: DistanceVector } = {};

    devices
      .filter((d) => d.deviceType === "router")
      .forEach((router) => {
        const dv: DistanceVector = {};

        devices
          .filter((d) => d.deviceType === "router")
          .forEach((dest) => {
            dv[dest.instanceId] = Infinity;
          });

        dv[router.instanceId] = 0;

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

  const processDistanceVector = (
    update: RoutingUpdate,
    currentDistanceVectors: { [key: string]: DistanceVector },
    currentRoutingTables: Record<string, RoutingTable>
  ) => {
    const { from, distanceVector } = update;
    let hasChanges = false;

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

      if (!currentDistanceVectors[neighbor]) {
        currentDistanceVectors[neighbor] = { [neighbor]: 0 };
      }

      Object.entries(distanceVector).forEach(([dest, cost]) => {
        if (dest === neighbor) return;

        const currentCost = currentDistanceVectors[neighbor][dest] || Infinity;
        const newCost = link.weight + cost;

        if (newCost < currentCost) {
          currentDistanceVectors[neighbor][dest] = newCost;

          if (!currentRoutingTables[neighbor]) {
            currentRoutingTables[neighbor] = {};
          }
          currentRoutingTables[neighbor][dest] = {
            nextHop: from,
            cost: newCost,
          };

          hasChanges = true;
        }
      });

      // Update self route
      currentDistanceVectors[neighbor][neighbor] = 0;
      if (!currentRoutingTables[neighbor]) {
        currentRoutingTables[neighbor] = {};
      }
      currentRoutingTables[neighbor][neighbor] = {
        nextHop: neighbor,
        cost: 0,
      };
    });

    return hasChanges;
  };

  const computeRoutingTables = () => {
    const newRoutingTables: Record<string, RoutingTable> = {};
    const newDistanceVectors = initializeDistanceVectors(devices);

    // Initialize routing tables
    devices
      .filter((d) => d.deviceType === "router")
      .forEach((router) => {
        const routerId = router.instanceId;
        newRoutingTables[routerId] = {};
        newDistanceVectors[routerId] = { [routerId]: 0 };

        // Initialize direct neighbors
        links.forEach((link) => {
          if (link.from === routerId) {
            newDistanceVectors[routerId][link.to] = link.weight;
            newRoutingTables[routerId][link.to] = {
              nextHop: link.to,
              cost: link.weight,
            };
          } else if (link.to === routerId) {
            newDistanceVectors[routerId][link.from] = link.weight;
            newRoutingTables[routerId][link.from] = {
              nextHop: link.from,
              cost: link.weight,
            };
          }
        });

        // Initialize self route
        newRoutingTables[routerId][routerId] = {
          nextHop: routerId,
          cost: 0,
        };
      });

    // Run Bellman-Ford algorithm
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = devices.length; // Prevent infinite loops

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      devices
        .filter((d) => d.deviceType === "router")
        .forEach((router) => {
          const initialUpdate: RoutingUpdate = {
            from: router.instanceId,
            distanceVector: newDistanceVectors[router.instanceId],
            timestamp: Date.now(),
          };
          const changes = processDistanceVector(
            initialUpdate,
            newDistanceVectors,
            newRoutingTables
          );
          hasChanges = hasChanges || changes;
        });
      iterations++;
    }

    setRoutingTables(newRoutingTables);
    setDistanceVectors(newDistanceVectors);
  };

  useEffect(() => {
    if (devices.length > 0) {
      computeRoutingTables();
    }
  }, [devices, links]);

  return {
    routingTables,
    distanceVectors,
    buildAdjacencyList,
    computeRoutingTables,
  };
}
