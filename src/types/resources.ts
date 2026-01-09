export enum ResourceType {
  TIME = 'TIME',
  MONEY = 'MONEY',
  HEALTH = 'HEALTH',
  COMFORT = 'COMFORT',
  EMOTIONS = 'EMOTIONS',
  NETWORK = 'NETWORK',
  MEANING = 'MEANING'
}

export enum TransactionType {
  LOSS = 'LOSS', // ШТРАФ
  COST = 'COST', // ЗАТРАТЫ
  PROFIT = 'PROFIT' // ПРОФИТ
}

export type ResourceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ResourceMatrix = {
  [K in TransactionType]: {
    [R in ResourceType]: ResourceValue;
  };
};

export interface ResourceInfo {
  key: ResourceType;
  name: string;
  emoji: string;
  color: string;
}

export interface TransactionInfo {
  key: TransactionType;
  name: string;
  color: string;
}
