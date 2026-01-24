-- Allow authenticated users to create HOAs (for onboarding)
CREATE POLICY "Authenticated users can create HOAs"
    ON public.hoas FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to insert their own user_roles (needed for onboarding)
CREATE POLICY "Users can create their own role during onboarding"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow users to create deposit accounts for their HOA during onboarding
CREATE POLICY "Users can create deposit accounts for HOAs they just created"
    ON public.deposit_accounts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to create invoice categories for their HOA during onboarding
CREATE POLICY "Users can create invoice categories for HOAs they just created"
    ON public.invoice_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to create transaction categories for their HOA during onboarding
CREATE POLICY "Users can create transaction categories for HOAs they just created"
    ON public.transaction_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);