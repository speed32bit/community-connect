// Application-specific types that extend or simplify the database types

export type AppRole = 'board_admin' | 'property_manager' | 'resident';
export type MemberType = 'owner' | 'resident';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'deleted';
export type PaymentMethod = 'check' | 'cash' | 'bank_transfer' | 'credit_card' | 'ach' | 'other';
export type TransactionType = 'income' | 'expense';
export type CollectionActionType = 'reminder_email' | 'phone_call' | 'formal_notice' | 'legal_action' | 'payment_plan' | 'other';
export type DocumentCategory = 'bylaws' | 'minutes' | 'financials' | 'forms' | 'insurance' | 'contracts' | 'other';
export type DuesFrequency = 'monthly' | 'quarterly' | 'annually';

export interface HOA {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  dues_amount: number;
  dues_frequency: DuesFrequency;
  late_fee_amount: number;
  late_fee_percentage: number;
  grace_period_days: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  hoa_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  hoa_id: string;
  unit_number: string;
  address?: string;
  building?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  parking_spaces: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UnitMember {
  id: string;
  unit_id: string;
  user_id: string;
  member_type: MemberType;
  is_primary: boolean;
  move_in_date?: string;
  move_out_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositAccount {
  id: string;
  hoa_id: string;
  name: string;
  account_number?: string;
  bank_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCategory {
  id: string;
  hoa_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  hoa_id: string;
  unit_id: string;
  invoice_number: string;
  title: string;
  description?: string;
  category_id?: string;
  amount: number;
  discount: number;
  late_fee: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  is_recurring: boolean;
  recurring_frequency?: DuesFrequency;
  deposit_account_id?: string;
  deleted_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  quantity: number;
  created_at: string;
}

export interface Payment {
  id: string;
  hoa_id: string;
  invoice_id: string;
  unit_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface TransactionCategory {
  id: string;
  hoa_id: string;
  name: string;
  type: TransactionType;
  created_at: string;
}

export interface Transaction {
  id: string;
  hoa_id: string;
  category_id?: string;
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  hoa_id: string;
  fiscal_year: number;
  name: string;
  total_amount: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  category_id?: string;
  category_name: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  annual_total: number;
  created_at: string;
}

export interface Document {
  id: string;
  hoa_id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  hoa_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  visibility: string;
  publish_date: string;
  expire_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionAction {
  id: string;
  hoa_id: string;
  unit_id: string;
  action_type: CollectionActionType;
  notes?: string;
  scheduled_date?: string;
  completed_date?: string;
  performed_by?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  hoa_id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  hoa_id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body?: string;
  status: string;
  template_id?: string;
  related_id?: string;
  related_type?: string;
  sent_by?: string;
  sent_at: string;
}

export interface Invitation {
  id: string;
  hoa_id: string;
  email: string;
  role: AppRole;
  unit_id?: string;
  member_type?: MemberType;
  token: string;
  expires_at: string;
  accepted_at?: string;
  invited_by?: string;
  created_at: string;
}

// Extended types with relations
export interface UnitWithMembers extends Unit {
  unit_members?: (UnitMember & { profile?: Profile })[];
  balance_due?: number;
}

export interface InvoiceWithDetails extends Invoice {
  unit?: Unit;
  category?: InvoiceCategory;
  deposit_account?: DepositAccount;
  payments?: Payment[];
  line_items?: InvoiceLineItem[];
  owner_name?: string;
  remaining_balance?: number;
}

export interface PaymentWithDetails extends Payment {
  invoice?: Invoice;
  unit?: Unit;
  recorded_by_profile?: Profile;
}

export interface TransactionWithCategory extends Transaction {
  category?: TransactionCategory;
}

export interface BudgetWithLines extends Budget {
  budget_lines?: BudgetLine[];
}

export interface CollectionActionWithDetails extends CollectionAction {
  unit?: UnitWithMembers;
  performed_by_profile?: Profile;
}
