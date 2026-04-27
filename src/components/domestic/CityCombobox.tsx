import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DOMESTIC_CITY_OPTIONS, titleCaseCity } from '@/data/domesticCities';
import type { DomesticCity } from '@/types/domestic';

interface Props {
  value?: DomesticCity | '';
  onChange: (value: DomesticCity) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeCity?: DomesticCity | ''; // hide a single city (e.g. the selected origin)
  className?: string;
  allowClear?: boolean;
  onClear?: () => void;
}

export function CityCombobox({
  value,
  onChange,
  disabled,
  placeholder = 'Select city',
  excludeCity,
  className,
  allowClear,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const options = DOMESTIC_CITY_OPTIONS.filter((o) => !excludeCity || o.value !== excludeCity);
  const selected = value ? titleCaseCity(value) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between bg-background hover:bg-accent', className)}
        >
          {selected ? (
            <span className="truncate">{selected}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-white dark:bg-gray-900" align="start">
        <Command className="bg-white dark:bg-gray-900">
          <CommandInput placeholder="Search cities..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            {allowClear && value && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onClear?.();
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}