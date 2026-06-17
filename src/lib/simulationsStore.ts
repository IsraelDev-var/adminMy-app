import type { StoredSimulation } from "@/src/types";

let _simulations: StoredSimulation[] = [];
let _nextIdx = 1;

export const simulationsStore = {
  getAll(): StoredSimulation[] {
    return [..._simulations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  add(sim: Omit<StoredSimulation, "id" | "createdAt">): StoredSimulation {
    const stored: StoredSimulation = {
      id: `SIM-${Date.now()}-${_nextIdx++}`,
      createdAt: new Date().toISOString(),
      ...sim,
    };
    _simulations.push(stored);
    return stored;
  },

  count(): number {
    return _simulations.length;
  },
};
