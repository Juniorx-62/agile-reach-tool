import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useSummarizeTask() {
  const [isLoading, setIsLoading] = useState(false);

  const summarize = async (description: string): Promise<string | null> => {
    if (!description || description.trim().length < 10) {
      toast({
        title: 'Descrição muito curta',
        description: 'A descrição precisa ter pelo menos 10 caracteres para gerar um resumo.',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-task', {
        body: { description },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar resumo');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.summary || null;
    } catch (error) {
      console.error('Summarize error:', error);
      toast({
        title: 'Erro ao gerar resumo',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { summarize, isLoading };
}
