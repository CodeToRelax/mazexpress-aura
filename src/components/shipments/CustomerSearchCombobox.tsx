import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usersApi } from '@/utilities/api/users.api';
import { useDebounce } from '@/hooks/useDebounce';
import type { User } from '@/types/user';

interface CustomerSearchComboboxProps {
  value: string;
  onChange: (csn: string) => void;
  disabled?: boolean;
}

export function CustomerSearchCombobox({ value, onChange, disabled }: CustomerSearchComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await usersApi.getUsers({
        search: query,
        userType: 'customer',
        limit: 10,
        page: 1,
      });
      setCustomers(response.data.users || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch) {
      searchCustomers(debouncedSearch);
    }
  }, [debouncedSearch, searchCustomers]);

  const selectedCustomer = customers.find(c => c.uniqueShippingNumber === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background hover:bg-accent"
          disabled={disabled}
        >
          {value ? (
            selectedCustomer ? (
              <span className="truncate">
                {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.uniqueShippingNumber})
              </span>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">
              {t('shipments.form.placeholders.searchCustomer', { defaultValue: 'Search by name, email, or CSN...' })}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('shipments.form.placeholders.searchCustomer', { defaultValue: 'Search by name, email, or CSN...' })}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t('shipments.form.startTyping', { defaultValue: 'Start typing to search customers...' })}
                  </p>
                </div>
              </CommandEmpty>
            ) : customers.length === 0 ? (
              <CommandEmpty>
                {t('shipments.form.noCustomersFound', { defaultValue: 'No customers found' })}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer._id}
                    value={customer.uniqueShippingNumber}
                    onSelect={() => {
                      onChange(customer.uniqueShippingNumber);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === customer.uniqueShippingNumber ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                      <span className="text-xs text-muted-foreground">
                        {customer.email} • CSN: {customer.uniqueShippingNumber}
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
