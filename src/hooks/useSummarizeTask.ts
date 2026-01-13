import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-task`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ description }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo');
      }

      return data.summary;
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
