import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SelectableChipProps {
  id: string;
  label: string;
  icon?: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function SelectableChip({
  id,
  label,
  icon,
  selected,
  onToggle,
}: SelectableChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
        'border cursor-pointer hover:shadow-md',
        selected
          ? 'bg-orange-100 border-orange-500 text-orange-900 shadow-sm'
          : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300'
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
      {selected && (
        <X size={14} className="ml-1 opacity-60 hover:opacity-100" />
      )}
    </button>
  );
}
