import { useState, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Eye, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ParsedRow {
  projeto: string;
  demanda: string;
  prioridade: number;
  titulo: string;
  tipo: string;
  categoria: string;
  responsavel: string;
  estimativa: number;
  intercorrencia: boolean;
  entregue: boolean;
  sprint: string;
  valid: boolean;
  errors: string[];
}

interface ValidationResult {
  rows: ParsedRow[];
  isValid: boolean;
  totalErrors: number;
  totalRows: number;
}

export default function Import() {
  const { projects, members, sprints, importTasks, addProject, addSprint } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const requiredColumns = [
    'Projeto',
    'Demanda',
    'Prioridade (0-5)',
    'Título',
    'Tipo (Frontend/Backend/Full Stack)',
    'Categoria (Refinamento/Feature/Bug)',
    'Responsável',
    'Estimativa (horas)',
    'Intercorrência (Sim/Não)',
    'Entregue (Sim/Não)',
  ];

  const exampleData = [
    { 
      projeto: 'Portal do Cliente', 
      demanda: 'PORTAL-123', 
      prioridade: '0', 
      titulo: 'Implementar login OAuth',
      tipo: 'Full Stack',
      categoria: 'Feature',
      responsavel: 'Ana Silva',
      estimativa: '16',
      intercorrencia: 'Não',
      entregue: 'Sim'
    },
    { 
      projeto: 'App Mobile', 
      demanda: 'MOBILE-456', 
      prioridade: '2', 
      titulo: 'Corrigir bug no checkout',
      tipo: 'Frontend',
      categoria: 'Bug',
      responsavel: 'Bruno Costa',
      estimativa: '8',
      intercorrencia: 'Sim',
      entregue: 'Não'
    },
  ];

  const parseFile = async (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const rows: ParsedRow[] = [];
          
          // Each sheet is a sprint
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length < 2) return; // Skip empty sheets
            
            const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              const errors: string[] = [];
              
              // Find column indices
              const projetoIdx = headers.findIndex((h: string) => h.includes('projeto'));
              const demandaIdx = headers.findIndex((h: string) => h.includes('demanda'));
              const prioridadeIdx = headers.findIndex((h: string) => h.includes('prioridade'));
              const tituloIdx = headers.findIndex((h: string) => h.includes('título') || h.includes('titulo'));
              const tipoIdx = headers.findIndex((h: string) => h.includes('tipo'));
              const categoriaIdx = headers.findIndex((h: string) => h.includes('categoria'));
              const responsavelIdx = headers.findIndex((h: string) => h.includes('responsável') || h.includes('responsavel'));
              const estimativaIdx = headers.findIndex((h: string) => h.includes('estimativa'));
              const intercorrenciaIdx = headers.findIndex((h: string) => h.includes('intercorrência') || h.includes('intercorrencia'));
              const entregueIdx = headers.findIndex((h: string) => h.includes('entregue'));

              const projeto = projetoIdx >= 0 ? String(row[projetoIdx] || '') : '';
              const demanda = demandaIdx >= 0 ? String(row[demandaIdx] || '') : '';
              const prioridade = prioridadeIdx >= 0 ? Number(row[prioridadeIdx]) || 3 : 3;
              const titulo = tituloIdx >= 0 ? String(row[tituloIdx] || '') : '';
              const tipo = tipoIdx >= 0 ? String(row[tipoIdx] || '').toLowerCase() : '';
              const categoria = categoriaIdx >= 0 ? String(row[categoriaIdx] || '').toLowerCase() : '';
              const responsavel = responsavelIdx >= 0 ? String(row[responsavelIdx] || '') : '';
              const estimativa = estimativaIdx >= 0 ? Number(row[estimativaIdx]) || 0 : 0;
              const intercorrenciaVal = intercorrenciaIdx >= 0 ? String(row[intercorrenciaIdx] || '').toLowerCase() : '';
              const entregueVal = entregueIdx >= 0 ? String(row[entregueIdx] || '').toLowerCase() : '';

              // Validate required fields
              if (!projeto) errors.push('Projeto obrigatório');
              if (!demanda) errors.push('Demanda obrigatória');
              if (!titulo) errors.push('Título obrigatório');
              if (prioridade < 0 || prioridade > 5) errors.push('Prioridade deve ser 0-5');

              const parsedRow: ParsedRow = {
                projeto,
                demanda,
                prioridade,
                titulo,
                tipo: tipo.includes('full') ? 'fullstack' : tipo.includes('back') ? 'backend' : 'frontend',
                categoria: categoria.includes('bug') ? 'bug' : categoria.includes('refin') ? 'refinement' : 'feature',
                responsavel,
                estimativa,
                intercorrencia: intercorrenciaVal === 'sim' || intercorrenciaVal === 'yes' || intercorrenciaVal === 'true',
                entregue: entregueVal === 'sim' || entregueVal === 'yes' || entregueVal === 'true',
                sprint: sheetName,
                valid: errors.length === 0,
                errors,
              };

              rows.push(parsedRow);
            }
          });

          resolve({
            rows,
            isValid: rows.every(r => r.valid),
            totalErrors: rows.filter(r => !r.valid).length,
            totalRows: rows.length,
          });
        } catch (error) {
          resolve({
            rows: [],
            isValid: false,
            totalErrors: 1,
            totalRows: 0,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const result = await parseFile(selectedFile);
      setValidationResult(result);
      setShowModal(true);
    }
  };

  const handleImport = async () => {
    if (!validationResult || !validationResult.isValid) {
      toast({ title: 'Erro', description: 'Corrija os erros antes de importar', variant: 'destructive' });
      return;
    }

    setImporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Create tasks from validated rows
      const tasksToImport = validationResult.rows.map(row => {
        // Find or create project
        let project = projects.find(p => p.name.toLowerCase() === row.projeto.toLowerCase());
        
        // Find or create sprint
        let sprint = sprints.find(s => s.name.toLowerCase() === row.sprint.toLowerCase());
        
        // Find member
        const member = members.find(m => m.name.toLowerCase() === row.responsavel.toLowerCase());

        return {
          projectId: project?.id || 'proj-1',
          sprintId: sprint?.id || 'sprint-1',
          demandId: row.demanda,
          priority: row.prioridade as 0 | 1 | 2 | 3 | 4 | 5,
          title: row.titulo,
          description: '',
          type: row.tipo as 'frontend' | 'backend' | 'fullstack',
          category: row.categoria as 'feature' | 'bug' | 'refinement',
          assignees: member ? [member.id] : [],
          estimatedHours: row.estimativa,
          hasIncident: row.intercorrencia,
          isDelivered: row.entregue,
          completedAt: row.entregue ? new Date() : undefined,
        };
      });

      importTasks(tasksToImport, importMode);

      setImporting(false);
      setShowModal(false);
      setImportResult({
        success: true,
        message: `Planilha importada com sucesso! ${validationResult.totalRows} tarefas foram ${importMode === 'overwrite' ? 'importadas' : 'adicionadas'}.`
      });
      toast({ title: 'Sucesso', description: `${validationResult.totalRows} tarefas importadas!` });
      setFile(null);
      setValidationResult(null);
    } catch (error) {
      setImporting(false);
      setImportResult({
        success: false,
        message: 'Erro ao importar planilha. Verifique o formato do arquivo.'
      });
      toast({ title: 'Erro', description: 'Falha ao importar planilha', variant: 'destructive' });
    }
  };

  return (
    <>
      <Header 
        title="Importar Planilha" 
        subtitle="Importe tarefas a partir de uma planilha Excel"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto">
          {/* Upload Area */}
          <div className="stat-card">
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Arraste e solte sua planilha aqui
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique para selecionar um arquivo
                </p>
                <Button variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </label>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Formatos suportados: .xlsx, .xls, .csv
            </p>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`stat-card mt-4 ${importResult.success ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <p className="text-sm font-medium">{importResult.message}</p>
              </div>
            </div>
          )}

          {/* Preview Card */}
          <div className="stat-card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Estrutura Esperada</h4>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Ver'} Exemplo
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Cada aba da planilha representa uma sprint. As seguintes colunas são obrigatórias:
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {requiredColumns.map((column) => (
                <div key={column} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{column}</span>
                </div>
              ))}
            </div>

            {showPreview && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Projeto</TableHead>
                      <TableHead className="text-xs">Demanda</TableHead>
                      <TableHead className="text-xs">Prioridade</TableHead>
                      <TableHead className="text-xs">Título</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Responsável</TableHead>
                      <TableHead className="text-xs">Estimativa</TableHead>
                      <TableHead className="text-xs">Intercorr.</TableHead>
                      <TableHead className="text-xs">Entregue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exampleData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">{row.projeto}</TableCell>
                        <TableCell className="text-xs">{row.demanda}</TableCell>
                        <TableCell className="text-xs">{row.prioridade}</TableCell>
                        <TableCell className="text-xs">{row.titulo}</TableCell>
                        <TableCell className="text-xs">{row.tipo}</TableCell>
                        <TableCell className="text-xs">{row.categoria}</TableCell>
                        <TableCell className="text-xs">{row.responsavel}</TableCell>
                        <TableCell className="text-xs">{row.estimativa}</TableCell>
                        <TableCell className="text-xs">{row.intercorrencia}</TableCell>
                        <TableCell className="text-xs">{row.entregue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal with Validation */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{file?.name}</span>
              </p>

              {/* Validation Summary */}
              {validationResult && (
                <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {validationResult.isValid 
                        ? `${validationResult.totalRows} linhas válidas para importação`
                        : `${validationResult.totalErrors} linhas com erros de ${validationResult.totalRows} total`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Preview of data */}
              {validationResult && validationResult.rows.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs w-10">Status</TableHead>
                        <TableHead className="text-xs">Sprint</TableHead>
                        <TableHead className="text-xs">Projeto</TableHead>
                        <TableHead className="text-xs">Demanda</TableHead>
                        <TableHead className="text-xs">Título</TableHead>
                        <TableHead className="text-xs">Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.rows.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx} className={!row.valid ? 'bg-destructive/5' : ''}>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <X className="w-4 h-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{row.sprint}</TableCell>
                          <TableCell className="text-xs">{row.projeto}</TableCell>
                          <TableCell className="text-xs">{row.demanda}</TableCell>
                          <TableCell className="text-xs truncate max-w-[150px]">{row.titulo}</TableCell>
                          <TableCell className="text-xs text-destructive">
                            {row.errors.join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validationResult.rows.length > 10 && (
                    <p className="text-xs text-muted-foreground p-2 text-center bg-muted/30">
                      ... e mais {validationResult.rows.length - 10} linhas
                    </p>
                  )}
                </div>
              )}

              {/* Import Mode */}
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium">Como deseja importar os dados?</p>
                
                <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'overwrite' | 'append')}>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="append" id="append" className="mt-0.5" />
                    <Label htmlFor="append" className="cursor-pointer">
                      <p className="font-medium">Adicionar novos dados</p>
                      <p className="text-sm text-muted-foreground">
                        Mantém os dados existentes e adiciona as novas tarefas
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="overwrite" id="overwrite" className="mt-0.5" />
                    <Label htmlFor="overwrite" className="cursor-pointer">
                      <p className="font-medium">Sobrescrever dados existentes</p>
                      <p className="text-sm text-muted-foreground">
                        Remove os dados atuais e importa apenas os novos
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing || !validationResult?.isValid}
              className="gradient-primary text-white"
            >
              {importing ? 'Importando...' : 'Confirmar Importação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
