import { format } from 'date-fns';
import type { UserFilters, User } from '@/types/user';
import { usersApi } from '@/utilities/api/users.api';

/**
 * Formats a date to a human-readable string
 */
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

/**
 * Formats a user's full name
 */
function formatFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Formats the user's address
 */
function formatAddress(user: User): string {
  const parts: string[] = [];
  
  if (user.address.street) parts.push(user.address.street);
  if (user.address.specificDescription) parts.push(user.address.specificDescription);
  
  return parts.length > 0 ? parts.join(', ') : '-';
}

/**
 * Formats country name
 */
function formatCountry(country: string): string {
  const countryMap: Record<string, string> = {
    libya: 'Libya',
    turkey: 'Turkey',
    china: 'China',
    uae: 'UAE',
  };
  return countryMap[country.toLowerCase()] || country;
}

/**
 * Formats gender
 */
function formatGender(gender: string): string {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

/**
 * Formats status
 */
function formatStatus(disabled: boolean): string {
  return disabled ? 'Disabled' : 'Active';
}

/**
 * Formats user type
 */
function formatUserType(userType: string): string {
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

/**
 * Escapes CSV field values
 */
function escapeCSVField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '';
  
  const stringField = String(field);
  
  // If field contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

/**
 * Converts users array to CSV content
 */
function usersToCSV(users: User[]): string {
  // CSV Headers
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Gender',
    'Birth Date',
    'Country',
    'City',
    'Address',
    'Status',
    'User Type',
    'Shipping Number',
    'Wallet ID',
    'Joined Date',
    'Last Updated',
  ];

  // CSV Rows
  const rows = users.map(user => [
    escapeCSVField(formatFullName(user)),
    escapeCSVField(user.email),
    escapeCSVField(user.phoneNumber),
    escapeCSVField(formatGender(user.gender)),
    escapeCSVField(format(new Date(user.birthdate), 'MMM dd, yyyy')),
    escapeCSVField(formatCountry(user.address.country)),
    escapeCSVField(user.address.city),
    escapeCSVField(formatAddress(user)),
    escapeCSVField(formatStatus(user.disabled)),
    escapeCSVField(formatUserType(user.userType)),
    escapeCSVField(user.uniqueShippingNumber),
    escapeCSVField(user.walletId || '-'),
    escapeCSVField(formatDate(user.createdAt)),
    escapeCSVField(formatDate(user.updatedAt)),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvContent;
}

/**
 * Generates filename for the CSV export
 */
function generateFilename(filters: UserFilters): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const userType = filters.userType || 'all';
  return `users-export-${userType}-${timestamp}.csv`;
}

/**
 * Triggers browser download of CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Main export function - fetches all users and exports to CSV
 */
export async function exportUsersToCSV(filters: UserFilters): Promise<void> {
  try {
    // Fetch all users matching the filters (no pagination limit)
    const allUsers = await usersApi.getAllUsersForExport(filters);
    
    if (allUsers.length === 0) {
      throw new Error('No users found to export');
    }

    // Convert to CSV
    const csvContent = usersToCSV(allUsers);
    
    // Generate filename and download
    const filename = generateFilename(filters);
    downloadCSV(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export users to CSV:', error);
    throw error;
  }
}
