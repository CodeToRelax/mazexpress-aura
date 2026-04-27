import { useEffect, useState, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, Search, User as UserIcon } from 'lucide-react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { usersApi } from '@/utilities/api/users.api';
import type { User } from '@/types/user';

interface Props {
  value: string; // userId
  selected?: User | null;
  onChange: (userId: string, user: User | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function initials(u: User | null | undefined): string {
  if (!u) return '?';
  const a = u.firstName?.[0] ?? '';
  const b = u.lastName?.[0] ?? '';
  const s = `${a}${b}`.toUpperCase();
  return s || (u.email?.[0]?.toUpperCase() ?? '?');
}

export function SenderUserCombobox({
  value,
  selected,
  onChange,
  disabled,
  placeholder = 'Search customer by name, email, or shipping number',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await usersApi.getUsers({ search: q, userType: 'customer', limit: 10, page: 1 });
      setResults(res.data.users || []);
    } catch (e) {
      console.error('User search failed', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounced) search(debounced);
  }, [debounced, search]);

  const display = selected
    ? `${selected.firstName ?? ''} ${selected.lastName ?? ''}`.trim() || selected.email || value
    : '';

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
          {value && display ? (
            <span className="flex items-center gap-2 truncate">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {initials(selected)}
              </span>
              <span className="truncate">{display}</span>
              {selected?.uniqueShippingNumber && (
                <span className="text-muted-foreground text-xs truncate">
                  · {selected.uniqueShippingNumber}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-white dark:bg-gray-900" align="start">
        <Command shouldFilter={false} className="bg-white dark:bg-gray-900">
          <CommandInput placeholder="Type at least 2 characters" value={query} onValueChange={setQuery} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : query.length < 2 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Start typing to search customers</p>
                </div>
              </CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>No customers found</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((u) => (
                  <CommandItem
                    key={u._id}
                    value={u._id}
                    onSelect={() => {
                      onChange(u._id, u);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex items-start gap-2"
                  >
                    <Check className={cn('mt-1 h-4 w-4 shrink-0', value === u._id ? 'opacity-100' : 'opacity-0')} />
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {initials(u)}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {u.uniqueShippingNumber ? `${u.uniqueShippingNumber} · ` : ''}
                        {u.phoneNumber || u.email}
                        {(u as unknown as { address?: { city?: string } })?.address?.city
                          ? ` · ${(u as unknown as { address?: { city?: string } }).address?.city}`
                          : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { UserIcon };