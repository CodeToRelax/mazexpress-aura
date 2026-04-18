import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  CheckCircle2,
  XCircle,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Package
} from 'lucide-react';
import type { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface UsersTableProps {
  users: User[];
  selectedUsers: Set<string>;
  onSelectUser: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  visibleColumns?: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  visibleColumns = new Set(['email', 'phone', 'status', 'country', 'joined']),
  sortBy,
  sortOrder,
  onSort,
}: UsersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const renderSortableHeader = (column: string, label: string) => {
    // Only allow sorting for columns that have API support
    const isSortable = onSort && ['name', 'email', 'role', 'joined'].includes(column);
    
    if (!isSortable) {
      return label;
    }

    return (
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label={t('users.table.sortBy', { column: label })}
      >
        <span>{label}</span>
        {getSortIcon(column)}
      </button>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('users.messages.copySuccess'),
    });
  };

  const allSelected = users.length > 0 && users.every(user => selectedUsers.has(user._id));
  const someSelected = users.some(user => selectedUsers.has(user._id)) && !allSelected;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || someSelected}
                onCheckedChange={onSelectAll}
                aria-label={t('users.table.selectAll')}
              />
            </TableHead>
            <TableHead>{renderSortableHeader('name', t('users.table.columns.user'))}</TableHead>
            <TableHead>{t('users.table.columns.shippingNumber')}</TableHead>
            {visibleColumns.has('email') && <TableHead>{renderSortableHeader('email', t('users.table.columns.email'))}</TableHead>}
            {visibleColumns.has('phone') && <TableHead>{renderSortableHeader('phone', t('users.table.columns.phone'))}</TableHead>}
            {visibleColumns.has('role') && <TableHead>{renderSortableHeader('role', t('users.table.columns.role'))}</TableHead>}
            {visibleColumns.has('status') && <TableHead>{t('users.table.columns.status')}</TableHead>}
            {visibleColumns.has('country') && <TableHead>{renderSortableHeader('country', t('users.table.columns.country'))}</TableHead>}
            {visibleColumns.has('birthdate') && <TableHead>{t('users.table.columns.birthdate', { defaultValue: 'Date of birth' })}</TableHead>}
            {visibleColumns.has('joined') && <TableHead>{renderSortableHeader('joined', t('users.table.columns.joined'))}</TableHead>}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow 
              key={user._id}
              className="cursor-pointer hover:bg-accent/20 transition-colors duration-150"
              onClick={() => navigate(`/users/${user._id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedUsers.has(user._id)}
                  onCheckedChange={() => onSelectUser(user._id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.username && (
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="font-mono text-sm">{user.uniqueShippingNumber}</span>
                </div>
              </TableCell>
              {visibleColumns.has('email') && (
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
              )}
              {visibleColumns.has('phone') && (
                <TableCell className="text-muted-foreground">{user.phoneNumber}</TableCell>
              )}
              {visibleColumns.has('role') && (
                <TableCell>
                  <Badge variant={user.userType === 'admin' ? 'default' : 'secondary'}>
                    {t(`users.table.role.${user.userType}`)}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has('status') && (
                <TableCell>
                  <Badge variant={user.disabled ? 'destructive' : 'default'} className="gap-1">
                    {user.disabled ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {t(`users.table.status.${user.disabled ? 'disabled' : 'active'}`)}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has('country') && (
                <TableCell className="text-muted-foreground capitalize">
                  {user.address.country}
                </TableCell>
              )}
              {visibleColumns.has('birthdate') && (
                <TableCell className="text-muted-foreground">
                  {user.birthdate ? format(new Date(user.birthdate), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
              )}
              {visibleColumns.has('joined') && (
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </TableCell>
              )}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('users.table.columns.actions')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/users/${user._id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('users.actions.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('users.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(user._id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('users.actions.copyId')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                      {user.disabled ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t('users.actions.activate')}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('users.actions.deactivate')}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(user)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('users.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
