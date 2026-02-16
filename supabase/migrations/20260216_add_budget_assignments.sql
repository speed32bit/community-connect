-- Budget Assignment Settings
-- Stores assessment allocation rules per budget (common area %, auto-invoice settings)
CREATE TABLE IF NOT EXISTS public.budget_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    common_area_percentage DECIMAL(5,2) DEFAULT 45.00 NOT NULL CHECK (common_area_percentage >= 0 AND common_area_percentage <= 100),
    auto_invoice_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (budget_id)
);

-- Enable RLS
ALTER TABLE public.budget_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_assignments
CREATE POLICY "Users can view budget assignments for their HOA"
    ON public.budget_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            JOIN public.user_roles ur ON b.hoa_id = ur.hoa_id
            WHERE b.id = budget_assignments.budget_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Board admins and managers can manage budget assignments"
    ON public.budget_assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.budgets b
            JOIN public.user_roles ur ON b.hoa_id = ur.hoa_id
            WHERE b.id = budget_assignments.budget_id
            AND ur.user_id = auth.uid()
            AND ur.role IN ('board_admin', 'property_manager')
        )
    );

CREATE POLICY "Board admins and managers can update budget assignments"
    ON public.budget_assignments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            JOIN public.user_roles ur ON b.hoa_id = ur.hoa_id
            WHERE b.id = budget_assignments.budget_id
            AND ur.user_id = auth.uid()
            AND ur.role IN ('board_admin', 'property_manager')
        )
    );

CREATE POLICY "Board admins and managers can delete budget assignments"
    ON public.budget_assignments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            JOIN public.user_roles ur ON b.hoa_id = ur.hoa_id
            WHERE b.id = budget_assignments.budget_id
            AND ur.user_id = auth.uid()
            AND ur.role IN ('board_admin', 'property_manager')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_assignments_budget_id ON public.budget_assignments(budget_id);
