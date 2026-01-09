import React, { useState, useEffect, useCallback } from 'react';
import { ResourceMatrix, ResourceType, TransactionType, ResourceValue } from '../types/resources';
import { RESOURCES, TRANSACTIONS, RESOURCE_TOOLTIPS } from '../config/resourceConstants';

interface ResourceMatrixInputProps {
  resources: ResourceMatrix;
  onChange: (newResources: ResourceMatrix) => void;
  onClose: () => void;
}

const ResourceMatrixInput: React.FC<ResourceMatrixInputProps> = ({ resources, onChange, onClose }) => {
  const [selectedCell, setSelectedCell] = useState<{ type: TransactionType; resource: ResourceType } | null>(null);

  const handleCellClick = (type: TransactionType, resource: ResourceType) => {
    setSelectedCell({ type, resource });
  };

  const handleValueSelect = (value: ResourceValue) => {
    if (!selectedCell) return;
    const newResources = JSON.parse(JSON.stringify(resources)) as ResourceMatrix;
    newResources[selectedCell.type][selectedCell.resource] = value;
    onChange(newResources);
    setSelectedCell(null);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedCell) setSelectedCell(null);
      else onClose();
    }
    
    if (selectedCell && /^[0-9]$/.test(e.key)) {
      handleValueSelect(parseInt(e.key) as ResourceValue);
    }
  }, [selectedCell, onClose, handleValueSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="absolute top-full left-0 mt-2 z-[100] bg-[#252525] border border-white/10 rounded-lg shadow-2xl p-4 min-w-[500px]" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-resource-header">Матрица ресурсов (0-9)</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
      </div>

      <div className="grid grid-cols-8 gap-1">
        {/* Header icons */}
        <div />
        {Object.values(RESOURCES).map(res => (
          <div key={res.key} className="flex flex-col items-center justify-center p-2" title={res.name}>
            <span className="text-xl">{res.emoji}</span>
            <span className="text-[8px] mt-1 opacity-50">{res.name}</span>
          </div>
        ))}

        {/* Rows */}
        {Object.values(TRANSACTIONS).map(trans => (
          <React.Fragment key={trans.key}>
            <div className="flex items-center pr-2 text-[10px] font-bold" style={{ color: trans.color }}>
              {trans.name}
            </div>
            {Object.keys(RESOURCES).map(resKey => {
              const resource = resKey as ResourceType;
              const value = resources[trans.key][resource];
              const isSelected = selectedCell?.type === trans.key && selectedCell?.resource === resource;
              
              return (
                <div
                  key={resource}
                  onClick={() => handleCellClick(trans.key, resource)}
                  className={`
                    h-10 flex items-center justify-center rounded cursor-pointer border transition-all
                    ${isSelected ? 'border-white/50 bg-white/10' : 'border-white/5 bg-black/20 hover:border-white/20'}
                    ${value > 0 ? 'font-bold' : 'opacity-20'}
                  `}
                  style={{ color: value > 0 ? trans.color : 'inherit' }}
                >
                  {value}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Popover for value selection */}
      {selectedCell && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{RESOURCES[selectedCell.resource].emoji}</span>
            <span className="text-xs font-bold" style={{ color: TRANSACTIONS[selectedCell.type].color }}>
              {TRANSACTIONS[selectedCell.type].name}: {RESOURCES[selectedCell.resource].name}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as ResourceValue[]).map(val => (
              <button
                key={val}
                onClick={() => handleValueSelect(val)}
                className="flex flex-col items-start p-2 bg-black/30 hover:bg-white/10 rounded border border-white/5 text-left group transition-all"
                title={RESOURCE_TOOLTIPS[selectedCell.resource][selectedCell.type][val]}
              >
                <span className="text-sm font-bold mb-1">{val}</span>
                <span className="text-[9px] opacity-40 group-hover:opacity-100 line-clamp-2 leading-tight">
                  {RESOURCE_TOOLTIPS[selectedCell.resource][selectedCell.type][val]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-[10px] text-white/30 text-center italic">
        Используйте цифры 0-9 для быстрого выбора значения
      </div>
    </div>
  );
};

export default ResourceMatrixInput;
