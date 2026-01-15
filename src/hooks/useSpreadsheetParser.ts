import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import * as XLSX from 'xlsx';

export interface ParsedTask {
  projeto: string;
  demanda: string;
  prioridade: number | null;
  titulo: string;
  tipo: 'frontend' | 'backend' | 'fullstack';
  categoria: 'bug' | 'feature' | 'refinement';
  responsaveis: string[];
  estimativa: number;
  intercorrencia: boolean;
  entregue: boolean;
  sprint: string;
  rowIndex: number;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface UnmatchedMember {
  firstName: string;
  occurrences: number;
  rows: number[];
}

export interface ParsedResult {
  status: 'success' | 'warning' | 'error';
  tasks: ParsedTask[];
  projects: string[];
  sprints: string[];
  errors: ValidationError[];
  unmatchedMembers: UnmatchedMember[];
  summary: {
    totalTasks: number;
    validTasks: number;
    tasksWithErrors: number;
    tasksWithWarnings: number;
    totalProjects: number;
    totalSprints: number;
    unmatchedMembersCount: number;
  };
}

export function useSpreadsheetParser() {
  const { members } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);

  const parseFile = useCallback(async (file: File): Promise<ParsedResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      // Convert workbook to structured data
      const spreadsheetData: Record<string, any[][]> = {};
      
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        spreadsheetData[sheetName] = jsonData;
      });

      // Call edge function for AI-powered parsing
      const { data: parsedData, error: parseError } = await supabase.functions.invoke('parse-spreadsheet', {
        body: {
          spreadsheetData,
          registeredMembers: members.map(m => ({ id: m.id, name: m.name })),
        },
      });

      if (parseError) {
        console.error('Parse error:', parseError);
        throw new Error(parseError.message || 'Erro ao processar planilha');
      }

      const parsedResult = parsedData as ParsedResult;
      setResult(parsedResult);
      return parsedResult;
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setError(err.message || 'Erro ao processar planilha');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [members]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parseFile,
    reset,
    isLoading,
    error,
    result,
  };
}
