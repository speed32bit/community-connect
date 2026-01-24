-- Add a SELECT policy that allows users to see any HOA where they have a role
-- This fixes the issue where INSERT with RETURNING fails because user can't SELECT the new row
DROP POLICY IF EXISTS "Users can view HOAs they belong to" ON public.hoas;

CREATE POLICY "Users can view HOAs they belong to"
    ON public.hoas FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.hoa_id = hoas.id 
            AND user_roles.user_id = auth.uid()
        )
    );