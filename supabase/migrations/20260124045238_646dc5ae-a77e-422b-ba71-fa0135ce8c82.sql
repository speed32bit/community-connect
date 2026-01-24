-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Allow authenticated users to upload to their HOA folder
CREATE POLICY "Users can upload documents to their HOA"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = (SELECT get_user_hoa_id(auth.uid())::text)
);

-- Allow users to view documents in their HOA
CREATE POLICY "Users can view documents in their HOA"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = (SELECT get_user_hoa_id(auth.uid())::text)
);

-- Allow managers to delete documents
CREATE POLICY "Managers can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = (SELECT get_user_hoa_id(auth.uid())::text)
    AND is_manager(auth.uid())
);