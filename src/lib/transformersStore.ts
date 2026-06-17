import { mockTransformers } from "@/src/data/mockData";
import type { Transformer, TransformerStatus, DistributorName } from "@/src/types";

let _transformers: Transformer[] = [...mockTransformers];

export const transformersStore = {
  getAll(): Transformer[] {
    return _transformers;
  },

  getByEde(ede: DistributorName): Transformer[] {
    return _transformers.filter((t) => t.distributorName === ede);
  },

  getById(id: number): Transformer | undefined {
    return _transformers.find((t) => t.id === id);
  },

  updateStatus(id: number, status: TransformerStatus, availableCapacityKva: number): Transformer | null {
    const idx = _transformers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const t = _transformers[idx];
    const availabilityPercent = Math.round((availableCapacityKva / t.totalCapacityKva) * 100);
    _transformers[idx] = {
      ...t,
      status,
      availableCapacityKva,
      availabilityPercent,
      lastUpdated: new Date().toISOString(),
    };
    return _transformers[idx];
  },
};
