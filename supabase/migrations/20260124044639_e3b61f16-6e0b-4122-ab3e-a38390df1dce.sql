-- Remove temporary permissive SELECT policy on HOAs
DROP POLICY IF EXISTS "Authenticated users can view any HOA temporarily" ON public.hoas;

-- Tighten deposit_accounts INSERT policy
DROP POLICY IF EXISTS "Users can create deposit accounts for HOAs they just created" ON public.deposit_accounts;
CREATE POLICY "Users can create deposit accounts for their HOA"
    ON public.deposit_accounts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.hoa_id = deposit_accounts.hoa_id 
            AND user_roles.user_id = auth.uid()
        )
    );

-- Tighten invoice_categories INSERT policy  
DROP POLICY IF EXISTS "Users can create invoice categories for HOAs they just created" ON public.invoice_categories;
CREATE POLICY "Users can create invoice categories for their HOA"
    ON public.invoice_categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.hoa_id = invoice_categories.hoa_id 
            AND user_roles.user_id = auth.uid()
        )
    );

-- Tighten transaction_categories INSERT policy
DROP POLICY IF EXISTS "Users can create transaction categories for HOAs they just crea" ON public.transaction_categories;
CREATE POLICY "Users can create transaction categories for their HOA"
    ON public.transaction_categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.hoa_id = transaction_categories.hoa_id 
            AND user_roles.user_id = auth.uid()
        )
    );