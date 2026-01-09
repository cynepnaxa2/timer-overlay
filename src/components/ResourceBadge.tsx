import React from 'react';
import { ResourceMatrix, ResourceType, TransactionType } from '../types/resources';
import { RESOURCES } from '../config/resourceConstants';

interface ResourceBadgeProps {
  resources: ResourceMatrix;
}

const ResourceBadge: React.FC<ResourceBadgeProps> = ({ resources }) => {
  const renderIcons = (type: TransactionType, dotColor: string) => {
    const activeResources = Object.entries(resources[type])
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        key: key as ResourceType,
        value,
        info: RESOURCES[key as ResourceType]
      }));

    if (activeResources.length === 0) return null;

    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/20 border border-white/5">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {activeResources.map(({ key, value, info }) => (
          <span key={key} className="text-[10px] flex items-center gap-0.5 opacity-80" title={`${info.name}: ${value}`}>
            <span>{info.emoji}</span>
            <span className="font-bold">{value}</span>
          </span>
        ))}
      </div>
    );
  };

  const hasLoss = Object.values(resources[TransactionType.LOSS]).some(v => v > 0);
  const hasCost = Object.values(resources[TransactionType.COST]).some(v => v > 0);
  const hasProfit = Object.values(resources[TransactionType.PROFIT]).some(v => v > 0);

  if (!hasLoss && !hasCost && !hasProfit) return null;

  return (
    <div className="flex items-center gap-1.5">
      {renderIcons(TransactionType.LOSS, 'bg-[#A05A2C]')}
      {renderIcons(TransactionType.COST, 'bg-[#FF5555]')}
      {(hasLoss || hasCost) && hasProfit && <span className="text-white/20 text-xs">➔</span>}
      {renderIcons(TransactionType.PROFIT, 'bg-[#50FA7B]')}
    </div>
  );
};

export default ResourceBadge;
