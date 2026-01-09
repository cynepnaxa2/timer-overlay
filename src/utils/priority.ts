import { ResourceMatrix, ResourceType, TransactionType } from '../types/resources';

const RESOURCE_WEIGHTS: Record<ResourceType, number> = {
  [ResourceType.TIME]: 1.2,
  [ResourceType.MONEY]: 1.2,
  [ResourceType.HEALTH]: 1.5,
  [ResourceType.COMFORT]: 1.0,
  [ResourceType.EMOTIONS]: 1.0,
  [ResourceType.NETWORK]: 1.0,
  [ResourceType.MEANING]: 1.5,
};

export function calculatePriorityScore(matrix: ResourceMatrix): number {
  let score = 0;

  // Profit adds to score
  Object.entries(matrix[TransactionType.PROFIT]).forEach(([key, value]) => {
    score += value * (RESOURCE_WEIGHTS[key as ResourceType] || 1);
  });

  // Cost subtracts from score
  Object.entries(matrix[TransactionType.COST]).forEach(([key, value]) => {
    score -= value * (RESOURCE_WEIGHTS[key as ResourceType] || 1) * 0.5; // Costs are less heavy than gains/losses
  });

  // Loss (avoidance of negative outcome) adds to priority
  Object.entries(matrix[TransactionType.LOSS]).forEach(([key, value]) => {
    score += value * (RESOURCE_WEIGHTS[key as ResourceType] || 1);
  });

  return Math.round(score * 10) / 10;
}
