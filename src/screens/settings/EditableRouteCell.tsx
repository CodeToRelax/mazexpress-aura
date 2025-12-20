import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditableRouteCellProps {
  price: number;
  originCity: string;
  destinationCity: string;
  onSave: (originCity: string, destinationCity: string, price: number) => Promise<void>;
  onDelete: () => void;
}

export function EditableRouteCell({
  price,
  originCity,
  destinationCity,
  onSave,
  onDelete,
}: EditableRouteCellProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState(price.toString());
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(price.toString());
  }, [price]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(price.toString());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(price.toString());
  };

  const handleSave = async () => {
    const newPrice = parseFloat(editValue);
    if (isNaN(newPrice) || newPrice < 0) {
      return;
    }

    if (newPrice === price) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(originCity, destinationCity, newPrice);
      setIsEditing(false);
    } catch {
      // Error is handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow button clicks
            setTimeout(() => {
              if (!isSaving) handleCancel();
            }, 150);
          }}
          className="h-7 w-16 text-center text-sm"
          disabled={isSaving}
        />
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleSave}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCancel}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleStartEdit}
        className={cn(
          "w-full h-8 px-2 py-1 rounded text-sm font-medium transition-all",
          "bg-primary/10 hover:bg-primary/20 text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        )}
      >
        {price} <span className="text-xs text-muted-foreground">LYD</span>
      </button>
      {isHovered && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
