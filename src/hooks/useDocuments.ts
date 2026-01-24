import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Document, DocumentCategory } from '@/types/database';
import { toast } from 'sonner';

export function useDocuments() {
  const { hoa, user } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!hoa?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      title, 
      description, 
      category 
    }: { 
      file: File; 
      title: string; 
      description?: string; 
      category: DocumentCategory;
    }) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${hoa.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          hoa_id: hoa.id,
          title,
          description,
          category,
          file_name: file.name,
          file_url: fileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload document: ' + error.message);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: Document) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_url]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete document: ' + error.message);
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    uploadDocument,
    deleteDocument,
    getDownloadUrl,
  };
}
