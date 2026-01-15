import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types for parsed data
interface ParsedTask {
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

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

interface UnmatchedMember {
  firstName: string;
  occurrences: number;
  rows: number[];
}

interface ParsedResult {
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

// Helper functions
function isIgnored(value: any): boolean {
  if (value === null || value === undefined) return true;
  const strValue = String(value).trim();
  return strValue === '' || strValue === '-';
}

function extractFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0].toLowerCase();
}

function parseBoolean(value: any): boolean {
  if (isIgnored(value)) return false;
  const strValue = String(value).toLowerCase().trim();
  return strValue === 'sim' || strValue === 'yes' || strValue === 'true' || strValue === '1';
}

function parsePriority(value: any): number | null {
  if (isIgnored(value)) return null;
  
  const strValue = String(value).toLowerCase().trim();
  
  // Handle p0-p5 format
  if (strValue.startsWith('p')) {
    const num = parseInt(strValue.substring(1), 10);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      return num;
    }
  }
  
  // Handle numeric format
  const num = parseInt(strValue, 10);
  if (!isNaN(num) && num >= 0 && num <= 5) {
    return num;
  }
  
  return null;
}

function parseType(value: any): 'frontend' | 'backend' | 'fullstack' {
  if (isIgnored(value)) return 'frontend';
  
  const strValue = String(value).toLowerCase().trim();
  
  if (strValue.includes('full') || strValue.includes('stack')) {
    return 'fullstack';
  } else if (strValue.includes('back')) {
    return 'backend';
  }
  return 'frontend';
}

function parseCategory(value: any): 'bug' | 'feature' | 'refinement' {
  if (isIgnored(value)) return 'feature';
  
  const strValue = String(value).toLowerCase().trim();
  
  if (strValue.includes('bug')) {
    return 'bug';
  } else if (strValue.includes('refin')) {
    return 'refinement';
  }
  return 'feature';
}

function parseEstimate(value: any): number {
  if (isIgnored(value)) return 0;
  
  const strValue = String(value).replace(',', '.').trim();
  const num = parseFloat(strValue);
  
  return isNaN(num) ? 0 : Math.max(0, num);
}

function parseResponsibles(value: any): string[] {
  if (isIgnored(value)) return [];
  
  const strValue = String(value).trim();
  const names = strValue.split('+').map(n => extractFirstName(n)).filter(n => n.length > 0);
  
  return [...new Set(names)]; // Remove duplicates
}

// Error message templates
const errorMessages = {
  projeto: "Esta tarefa não está associada a nenhum projeto.",
  demanda: "Número da task inválido ou ausente.",
  prioridade: "Prioridade deve estar entre p0 e p5.",
  titulo: "O título da tarefa é obrigatório.",
  tipo: "Tipo deve ser Frontend, Backend ou Fullstack.",
  categoria: "Categoria deve ser Bug, Feature ou Refinamento.",
  responsavel: "Este membro ainda não existe no sistema.",
  estimativa: "Informe a estimativa em horas (ex: 2.5).",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { spreadsheetData, registeredMembers } = await req.json();
    
    console.log("Processing spreadsheet for user:", userId);
    
    // Normalize registered member names for comparison
    const memberFirstNames = new Set(
      (registeredMembers || []).map((m: { name: string }) => 
        m.name.split(' ')[0].toLowerCase()
      )
    );
    
    const result: ParsedResult = {
      status: 'success',
      tasks: [],
      projects: [],
      sprints: [],
      errors: [],
      unmatchedMembers: [],
      summary: {
        totalTasks: 0,
        validTasks: 0,
        tasksWithErrors: 0,
        tasksWithWarnings: 0,
        totalProjects: 0,
        totalSprints: 0,
        unmatchedMembersCount: 0,
      },
    };
    
    const projectsSet = new Set<string>();
    const sprintsSet = new Set<string>();
    const unmatchedMembersMap = new Map<string, { count: number; rows: number[] }>();
    const rowErrors = new Map<number, number>();
    const rowWarnings = new Map<number, number>();
    
    // Process each sheet (sprint)
    for (const [sprintName, sheetData] of Object.entries(spreadsheetData as Record<string, any[][]>)) {
      if (!Array.isArray(sheetData) || sheetData.length < 2) continue;
      
      sprintsSet.add(sprintName);
      
      const headers = (sheetData[0] as any[]).map((h: any) => 
        String(h || '').toLowerCase().trim()
      );
      
      // Find column indices
      const colIdx = {
        projeto: headers.findIndex((h: string) => h.includes('projeto')),
        demanda: headers.findIndex((h: string) => h.includes('demanda')),
        prioridade: headers.findIndex((h: string) => h.includes('prioridade')),
        titulo: headers.findIndex((h: string) => h.includes('título') || h.includes('titulo')),
        tipo: headers.findIndex((h: string) => h.includes('tipo')),
        categoria: headers.findIndex((h: string) => h.includes('categoria')),
        responsavel: headers.findIndex((h: string) => h.includes('responsável') || h.includes('responsavel')),
        estimativa: headers.findIndex((h: string) => h.includes('estimativa')),
        intercorrencia: headers.findIndex((h: string) => h.includes('intercorrência') || h.includes('intercorrencia')),
        entregue: headers.findIndex((h: string) => h.includes('entregue')),
      };
      
      // Process rows
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0) continue;
        
        const globalRowIndex = result.tasks.length + 1;
        
        // Extract raw values
        const projeto = colIdx.projeto >= 0 && !isIgnored(row[colIdx.projeto]) 
          ? String(row[colIdx.projeto]).trim() : '';
        const demanda = colIdx.demanda >= 0 && !isIgnored(row[colIdx.demanda]) 
          ? String(row[colIdx.demanda]).trim() : '';
        const titulo = colIdx.titulo >= 0 && !isIgnored(row[colIdx.titulo]) 
          ? String(row[colIdx.titulo]).trim() : '';
        
        // Skip completely empty rows
        if (!projeto && !demanda && !titulo) continue;
        
        const prioridadeRaw = colIdx.prioridade >= 0 ? row[colIdx.prioridade] : null;
        const tipoRaw = colIdx.tipo >= 0 ? row[colIdx.tipo] : null;
        const categoriaRaw = colIdx.categoria >= 0 ? row[colIdx.categoria] : null;
        const responsavelRaw = colIdx.responsavel >= 0 ? row[colIdx.responsavel] : null;
        const estimativaRaw = colIdx.estimativa >= 0 ? row[colIdx.estimativa] : null;
        const intercorrenciaRaw = colIdx.intercorrencia >= 0 ? row[colIdx.intercorrencia] : null;
        const entregueRaw = colIdx.entregue >= 0 ? row[colIdx.entregue] : null;
        
        // Parse values
        const prioridade = parsePriority(prioridadeRaw);
        const tipo = parseType(tipoRaw);
        const categoria = parseCategory(categoriaRaw);
        const responsaveis = parseResponsibles(responsavelRaw);
        const estimativa = parseEstimate(estimativaRaw);
        const intercorrencia = parseBoolean(intercorrenciaRaw);
        const entregue = parseBoolean(entregueRaw);
        
        // Validate and collect errors
        if (!projeto) {
          result.errors.push({
            row: globalRowIndex,
            column: 'Projeto',
            message: errorMessages.projeto,
            severity: 'error',
          });
          rowErrors.set(globalRowIndex, (rowErrors.get(globalRowIndex) || 0) + 1);
        } else {
          projectsSet.add(projeto);
        }
        
        if (!demanda) {
          result.errors.push({
            row: globalRowIndex,
            column: 'Demanda',
            message: errorMessages.demanda,
            severity: 'error',
          });
          rowErrors.set(globalRowIndex, (rowErrors.get(globalRowIndex) || 0) + 1);
        }
        
        if (!titulo) {
          result.errors.push({
            row: globalRowIndex,
            column: 'Título',
            message: errorMessages.titulo,
            severity: 'error',
          });
          rowErrors.set(globalRowIndex, (rowErrors.get(globalRowIndex) || 0) + 1);
        }
        
        // Priority validation - only if value exists and is invalid
        if (!isIgnored(prioridadeRaw) && prioridade === null) {
          result.errors.push({
            row: globalRowIndex,
            column: 'Prioridade',
            message: errorMessages.prioridade,
            severity: 'warning',
          });
          rowWarnings.set(globalRowIndex, (rowWarnings.get(globalRowIndex) || 0) + 1);
        }
        
        // Check for unmatched members
        for (const firstName of responsaveis) {
          if (!memberFirstNames.has(firstName)) {
            result.errors.push({
              row: globalRowIndex,
              column: 'Responsável',
              message: `Membro "${firstName}" não encontrado no sistema.`,
              severity: 'warning',
            });
            rowWarnings.set(globalRowIndex, (rowWarnings.get(globalRowIndex) || 0) + 1);
            
            if (!unmatchedMembersMap.has(firstName)) {
              unmatchedMembersMap.set(firstName, { count: 0, rows: [] });
            }
            const entry = unmatchedMembersMap.get(firstName)!;
            entry.count++;
            entry.rows.push(globalRowIndex);
          }
        }
        
        // Estimate validation
        if (!isIgnored(estimativaRaw) && estimativa === 0) {
          result.errors.push({
            row: globalRowIndex,
            column: 'Estimativa',
            message: errorMessages.estimativa,
            severity: 'warning',
          });
          rowWarnings.set(globalRowIndex, (rowWarnings.get(globalRowIndex) || 0) + 1);
        }
        
        // Add parsed task
        result.tasks.push({
          projeto,
          demanda,
          prioridade,
          titulo,
          tipo,
          categoria,
          responsaveis,
          estimativa,
          intercorrencia,
          entregue,
          sprint: sprintName,
          rowIndex: globalRowIndex,
        });
      }
    }
    
    // Compile unmatched members
    for (const [firstName, data] of unmatchedMembersMap.entries()) {
      result.unmatchedMembers.push({
        firstName,
        occurrences: data.count,
        rows: data.rows,
      });
    }
    
    // Calculate summary
    result.projects = Array.from(projectsSet);
    result.sprints = Array.from(sprintsSet);
    result.summary = {
      totalTasks: result.tasks.length,
      validTasks: result.tasks.length - rowErrors.size,
      tasksWithErrors: rowErrors.size,
      tasksWithWarnings: rowWarnings.size,
      totalProjects: result.projects.length,
      totalSprints: result.sprints.length,
      unmatchedMembersCount: result.unmatchedMembers.length,
    };
    
    // Determine overall status
    if (rowErrors.size > 0) {
      result.status = 'error';
    } else if (rowWarnings.size > 0) {
      result.status = 'warning';
    } else {
      result.status = 'success';
    }
    
    console.log("Parse completed for user:", userId, {
      status: result.status,
      tasks: result.tasks.length,
    });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Error parsing spreadsheet:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: 'error',
        tasks: [],
        projects: [],
        sprints: [],
        errors: [{ row: 0, column: 'Sistema', message: errorMessage, severity: 'error' }],
        unmatchedMembers: [],
        summary: {
          totalTasks: 0,
          validTasks: 0,
          tasksWithErrors: 1,
          tasksWithWarnings: 0,
          totalProjects: 0,
          totalSprints: 0,
          unmatchedMembersCount: 0,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
