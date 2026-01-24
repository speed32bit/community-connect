-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('board_admin', 'property_manager', 'resident');

-- Create member_type enum for unit membership
CREATE TYPE public.member_type AS ENUM ('owner', 'resident');

-- Create invoice_status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled', 'deleted');

-- Create payment_method enum
CREATE TYPE public.payment_method AS ENUM ('check', 'cash', 'bank_transfer', 'credit_card', 'ach', 'other');

-- Create transaction_type enum
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Create collection_action_type enum
CREATE TYPE public.collection_action_type AS ENUM ('reminder_email', 'phone_call', 'formal_notice', 'legal_action', 'payment_plan', 'other');

-- Create document_category enum
CREATE TYPE public.document_category AS ENUM ('bylaws', 'minutes', 'financials', 'forms', 'insurance', 'contracts', 'other');

-- Create dues_frequency enum
CREATE TYPE public.dues_frequency AS ENUM ('monthly', 'quarterly', 'annually');

-- HOAs table (organizations)
CREATE TABLE public.hoas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    dues_amount DECIMAL(10,2) DEFAULT 0,
    dues_frequency dues_frequency DEFAULT 'monthly',
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    grace_period_days INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (role assignments per user)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, hoa_id, role)
);

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Units table (properties within HOA)
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    unit_number TEXT NOT NULL,
    address TEXT,
    building TEXT,
    floor INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    parking_spaces INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hoa_id, unit_number)
);

-- Unit members table (many-to-many users to units)
CREATE TABLE public.unit_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    member_type member_type NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    move_in_date DATE,
    move_out_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (unit_id, user_id)
);

-- Deposit accounts table
CREATE TABLE public.deposit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice categories table
CREATE TABLE public.invoice_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.invoice_categories(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'pending',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency dues_frequency,
    deposit_account_id UUID REFERENCES public.deposit_accounts(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hoa_id, invoice_number)
);

-- Invoice line items table (optional breakdown)
CREATE TABLE public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction categories table
CREATE TABLE public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table (general ledger)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type transaction_type NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id UUID,
    reference_type TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budgets table (annual budget headers)
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    name TEXT NOT NULL,
    total_amount DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hoa_id, fiscal_year)
);

-- Budget lines table
CREATE TABLE public.budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    january DECIMAL(10,2) DEFAULT 0,
    february DECIMAL(10,2) DEFAULT 0,
    march DECIMAL(10,2) DEFAULT 0,
    april DECIMAL(10,2) DEFAULT 0,
    may DECIMAL(10,2) DEFAULT 0,
    june DECIMAL(10,2) DEFAULT 0,
    july DECIMAL(10,2) DEFAULT 0,
    august DECIMAL(10,2) DEFAULT 0,
    september DECIMAL(10,2) DEFAULT 0,
    october DECIMAL(10,2) DEFAULT 0,
    november DECIMAL(10,2) DEFAULT 0,
    december DECIMAL(10,2) DEFAULT 0,
    annual_total DECIMAL(12,2) GENERATED ALWAYS AS (
        january + february + march + april + may + june + 
        july + august + september + october + november + december
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category document_category NOT NULL DEFAULT 'other',
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'all',
    publish_date TIMESTAMPTZ DEFAULT now(),
    expire_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collection actions table (delinquency workflow log)
CREATE TABLE public.collection_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    action_type collection_action_type NOT NULL,
    notes TEXT,
    scheduled_date DATE,
    completed_date DATE,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email templates table
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email log table
CREATE TABLE public.email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body TEXT,
    status TEXT DEFAULT 'sent',
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    related_id UUID,
    related_type TEXT,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invitations table for invite-based onboarding
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'resident',
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    member_type member_type DEFAULT 'resident',
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.hoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user has any management role (board_admin or property_manager)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('board_admin', 'property_manager')
    )
$$;

-- Function to get user's HOA id
CREATE OR REPLACE FUNCTION public.get_user_hoa_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT hoa_id
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Function to check if user belongs to a unit
CREATE OR REPLACE FUNCTION public.user_belongs_to_unit(_user_id UUID, _unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.unit_members
        WHERE user_id = _user_id
          AND unit_id = _unit_id
    )
$$;

-- RLS Policies

-- HOAs policies
CREATE POLICY "Users can view their HOA"
    ON public.hoas FOR SELECT
    TO authenticated
    USING (id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Board admins can update HOA"
    ON public.hoas FOR UPDATE
    TO authenticated
    USING (id = public.get_user_hoa_id(auth.uid()) AND public.has_role(auth.uid(), 'board_admin'));

-- User roles policies
CREATE POLICY "Users can view roles in their HOA"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Board admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.has_role(auth.uid(), 'board_admin'));

-- Profiles policies
CREATE POLICY "Users can view profiles in their HOA"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur1, public.user_roles ur2
            WHERE ur1.user_id = auth.uid()
            AND ur2.user_id = profiles.user_id
            AND ur1.hoa_id = ur2.hoa_id
        )
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Units policies
CREATE POLICY "Users can view units in their HOA"
    ON public.units FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Managers can manage units"
    ON public.units FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Unit members policies
CREATE POLICY "Users can view unit members in their HOA"
    ON public.unit_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.units u
            WHERE u.id = unit_members.unit_id
            AND u.hoa_id = public.get_user_hoa_id(auth.uid())
        )
    );

CREATE POLICY "Managers can manage unit members"
    ON public.unit_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.units u
            WHERE u.id = unit_members.unit_id
            AND u.hoa_id = public.get_user_hoa_id(auth.uid())
        ) AND public.is_manager(auth.uid())
    );

-- Deposit accounts policies
CREATE POLICY "Users can view deposit accounts"
    ON public.deposit_accounts FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Board admins can manage deposit accounts"
    ON public.deposit_accounts FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.has_role(auth.uid(), 'board_admin'));

-- Invoice categories policies
CREATE POLICY "Users can view invoice categories"
    ON public.invoice_categories FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Managers can manage invoice categories"
    ON public.invoice_categories FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Invoices policies
CREATE POLICY "Managers can view all invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Residents can view their own invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_unit(auth.uid(), unit_id));

CREATE POLICY "Managers can manage invoices"
    ON public.invoices FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Invoice line items policies
CREATE POLICY "Users can view invoice line items"
    ON public.invoice_line_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_line_items.invoice_id
            AND (
                (i.hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()))
                OR public.user_belongs_to_unit(auth.uid(), i.unit_id)
            )
        )
    );

CREATE POLICY "Managers can manage invoice line items"
    ON public.invoice_line_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_line_items.invoice_id
            AND i.hoa_id = public.get_user_hoa_id(auth.uid())
            AND public.is_manager(auth.uid())
        )
    );

-- Payments policies
CREATE POLICY "Managers can view all payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Residents can view their own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_unit(auth.uid(), unit_id));

CREATE POLICY "Managers can manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Transaction categories policies
CREATE POLICY "Users can view transaction categories"
    ON public.transaction_categories FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Managers can manage transaction categories"
    ON public.transaction_categories FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Transactions policies
CREATE POLICY "Managers can view transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Budgets policies
CREATE POLICY "Managers can view budgets"
    ON public.budgets FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage budgets"
    ON public.budgets FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Budget lines policies
CREATE POLICY "Managers can view budget lines"
    ON public.budget_lines FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            WHERE b.id = budget_lines.budget_id
            AND b.hoa_id = public.get_user_hoa_id(auth.uid())
            AND public.is_manager(auth.uid())
        )
    );

CREATE POLICY "Managers can manage budget lines"
    ON public.budget_lines FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            WHERE b.id = budget_lines.budget_id
            AND b.hoa_id = public.get_user_hoa_id(auth.uid())
            AND public.is_manager(auth.uid())
        )
    );

-- Documents policies
CREATE POLICY "Users can view documents in their HOA"
    ON public.documents FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Managers can manage documents"
    ON public.documents FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Announcements policies
CREATE POLICY "Users can view announcements in their HOA"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()));

CREATE POLICY "Managers can manage announcements"
    ON public.announcements FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Collection actions policies
CREATE POLICY "Managers can view collection actions"
    ON public.collection_actions FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage collection actions"
    ON public.collection_actions FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Email templates policies
CREATE POLICY "Managers can view email templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage email templates"
    ON public.email_templates FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Email log policies
CREATE POLICY "Managers can view email log"
    ON public.email_log FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can insert email log"
    ON public.email_log FOR INSERT
    TO authenticated
    WITH CHECK (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

-- Audit log policies
CREATE POLICY "Managers can view audit log"
    ON public.audit_log FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Authenticated users can insert audit log"
    ON public.audit_log FOR INSERT
    TO authenticated
    WITH CHECK (hoa_id = public.get_user_hoa_id(auth.uid()));

-- Invitations policies
CREATE POLICY "Managers can view invitations"
    ON public.invitations FOR SELECT
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage invitations"
    ON public.invitations FOR ALL
    TO authenticated
    USING (hoa_id = public.get_user_hoa_id(auth.uid()) AND public.is_manager(auth.uid()));

CREATE POLICY "Anyone can view invitations by token"
    ON public.invitations FOR SELECT
    TO anon
    USING (expires_at > now() AND accepted_at IS NULL);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_hoas_updated_at
    BEFORE UPDATE ON public.hoas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_members_updated_at
    BEFORE UPDATE ON public.unit_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposit_accounts_updated_at
    BEFORE UPDATE ON public.deposit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_hoa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    year_prefix TEXT;
BEGIN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^INV-' || year_prefix || '-[0-9]+$')
            THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO next_num
    FROM public.invoices
    WHERE hoa_id = _hoa_id;
    
    RETURN 'INV-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;