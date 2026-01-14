import { useState, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Eye, X, UserPlus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { MemberFormModal } from '@/components/modals/MemberFormModal';
import * as XLSX from 'xlsx';

interface ParsedRow {
  projeto: string;
  demanda: string;
  prioridade: number | null; // null when "-"
  titulo: string;
  tipo: string;
  categoria: string;
  responsaveis: string[]; // Array of first names
  estimativa: number;
  intercorrencia: boolean;
  entregue: boolean;
  sprint: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  unmatchedMembers: string[];
}

interface ValidationResult {
  rows: ParsedRow[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  totalRows: number;
  unmatchedMembersAll: string[];
}

export default function Import() {
  const { projects, members, sprints, importTasks, addProject, addSprint, addMember } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [pendingMemberName, setPendingMemberName] = useState('');

  const requiredColumns = [
    'Projeto',
    'Demanda',
    'Prioridade',
    'Título',
    'Tipo',
    'Categoria',
    'Responsável',
    'Estimativa',
    'Intercorrência',
    'Entregue',
  ];

  const exampleData = [
    { 
      projeto: 'Portal do Cliente', 
      demanda: 'PORTAL-123', 
      prioridade: '0', 
      titulo: 'Implementar login OAuth',
      tipo: 'fullstack',
      categoria: 'feature',
      responsavel: 'illian + natan',
      estimativa: '16',
      intercorrencia: 'Não',
      entregue: 'Sim'
    },
    { 
      projeto: 'App Mobile', 
      demanda: 'MOBILE-456', 
      prioridade: '-', 
      titulo: 'Corrigir bug no checkout',
      tipo: 'frontend',
      categoria: 'bug',
      responsavel: 'Bruno',
      estimativa: '8',
      intercorrencia: 'Sim',
      entregue: 'Não'
    },
  ];

  // Helper to extract first name
  const extractFirstName = (fullName: string): string => {
    return fullName.trim().split(' ')[0].toLowerCase();
  };

  // Helper to find member by first name
  const findMemberByFirstName = (firstName: string): string | null => {
    const normalizedSearch = firstName.toLowerCase().trim();
    const member = members.find(m => {
      const memberFirstName = m.name.split(' ')[0].toLowerCase();
      return memberFirstName === normalizedSearch;
    });
    return member?.id || null;
  };

  // Helper to check if value is empty/ignored
  const isIgnored = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    const strValue = String(value).trim();
    return strValue === '' || strValue === '-';
  };

  const parseFile = async (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const rows: ParsedRow[] = [];
          const allUnmatchedMembers = new Set<string>();
          
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
              const warnings: string[] = [];
              const unmatchedMembers: string[] = [];
              
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

              // Extract values (ignore "-" values)
              const projeto = projetoIdx >= 0 && !isIgnored(row[projetoIdx]) ? String(row[projetoIdx]).trim() : '';
              const demanda = demandaIdx >= 0 && !isIgnored(row[demandaIdx]) ? String(row[demandaIdx]).trim() : '';
              const tituloRaw = tituloIdx >= 0 ? row[tituloIdx] : '';
              const titulo = !isIgnored(tituloRaw) ? String(tituloRaw).trim() : '';
              
              // Priority: 0 = high, "-" = ignore/no priority
              const prioridadeRaw = prioridadeIdx >= 0 ? row[prioridadeIdx] : null;
              let prioridade: number | null = null;
              if (!isIgnored(prioridadeRaw)) {
                const parsed = Number(prioridadeRaw);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
                  prioridade = parsed;
                }
              }
              
              // Type parsing
              const tipoRaw = tipoIdx >= 0 && !isIgnored(row[tipoIdx]) ? String(row[tipoIdx]).toLowerCase().trim() : '';
              let tipo = 'frontend';
              if (tipoRaw.includes('full') || tipoRaw.includes('stack')) {
                tipo = 'fullstack';
              } else if (tipoRaw.includes('back')) {
                tipo = 'backend';
              } else if (tipoRaw.includes('front')) {
                tipo = 'frontend';
              }
              
              // Category parsing
              const categoriaRaw = categoriaIdx >= 0 && !isIgnored(row[categoriaIdx]) ? String(row[categoriaIdx]).toLowerCase().trim() : '';
              let categoria = 'feature';
              if (categoriaRaw.includes('bug')) {
                categoria = 'bug';
              } else if (categoriaRaw.includes('refin')) {
                categoria = 'refinement';
              }
              
              // Responsibles: can have multiple separated by "+"
              const responsavelRaw = responsavelIdx >= 0 && !isIgnored(row[responsavelIdx]) ? String(row[responsavelIdx]).trim() : '';
              const responsaveis: string[] = [];
              if (responsavelRaw) {
                const names = responsavelRaw.split('+').map(n => extractFirstName(n));
                names.forEach(name => {
                  if (name) {
                    responsaveis.push(name);
                    // Check if member exists
                    if (!findMemberByFirstName(name)) {
                      unmatchedMembers.push(name);
                      allUnmatchedMembers.add(name);
                    }
                  }
                });
              }
              
              // Estimate
              const estimativaRaw = estimativaIdx >= 0 ? row[estimativaIdx] : 0;
              const estimativa = !isIgnored(estimativaRaw) ? Number(estimativaRaw) || 0 : 0;
              
              // Intercurrence and Delivered: only "Sim" = true
              const intercorrenciaVal = intercorrenciaIdx >= 0 ? String(row[intercorrenciaIdx] || '').toLowerCase().trim() : '';
              const intercorrencia = intercorrenciaVal === 'sim' || intercorrenciaVal === 'yes' || intercorrenciaVal === 'true';
              
              const entregueVal = entregueIdx >= 0 ? String(row[entregueIdx] || '').toLowerCase().trim() : '';
              const entregue = entregueVal === 'sim' || entregueVal === 'yes' || entregueVal === 'true';

              // Validate required fields
              if (!projeto) errors.push('Projeto obrigatório');
              if (!demanda) errors.push('Demanda obrigatória');
              if (!titulo) errors.push('Título obrigatório');
              
              // Warnings for unmatched members
              if (unmatchedMembers.length > 0) {
                warnings.push(`Membros não encontrados: ${unmatchedMembers.join(', ')}`);
              }

              const parsedRow: ParsedRow = {
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
                sprint: sheetName,
                valid: errors.length === 0,
                errors,
                warnings,
                unmatchedMembers,
              };

              // Only add rows with at least title or demanda
              if (titulo || demanda) {
                rows.push(parsedRow);
              }
            }
          });

          resolve({
            rows,
            isValid: rows.every(r => r.valid),
            totalErrors: rows.filter(r => !r.valid).length,
            totalWarnings: rows.filter(r => r.warnings.length > 0).length,
            totalRows: rows.length,
            unmatchedMembersAll: Array.from(allUnmatchedMembers),
          });
        } catch (error) {
          console.error('Parse error:', error);
          resolve({
            rows: [],
            isValid: false,
            totalErrors: 1,
            totalWarnings: 0,
            totalRows: 0,
            unmatchedMembersAll: [],
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

  const handleCreateMember = (memberName: string) => {
    setPendingMemberName(memberName);
    setShowMemberModal(true);
  };

  const handleMemberCreated = async () => {
    setShowMemberModal(false);
    setPendingMemberName('');
    // Re-parse file to update member matching
    if (file) {
      const result = await parseFile(file);
      setValidationResult(result);
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
        
        // Find members by first name
        const assigneeIds: string[] = [];
        row.responsaveis.forEach(firstName => {
          const memberId = findMemberByFirstName(firstName);
          if (memberId) {
            assigneeIds.push(memberId);
          }
        });

        return {
          projectId: project?.id || 'proj-1',
          sprintId: sprint?.id || 'sprint-1',
          demandId: row.demanda,
          priority: (row.prioridade !== null ? row.prioridade : 3) as 0 | 1 | 2 | 3 | 4 | 5,
          title: row.titulo,
          description: '',
          type: row.tipo as 'frontend' | 'backend' | 'fullstack',
          category: row.categoria as 'feature' | 'bug' | 'refinement',
          assignees: assigneeIds,
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
              <h4 className="font-semibold text-foreground">Estrutura Esperada (Planilha Modelo)</h4>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Ver'} Exemplo
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Cada aba da planilha representa uma sprint. Colunas esperadas:
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {requiredColumns.map((column) => (
                <div key={column} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{column}</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <p><strong>Prioridade:</strong> 0 = alta, 1-5 = outras prioridades, "-" = ignorar</p>
              <p><strong>Responsável:</strong> Múltiplos separados por "+". Ex: "illian + natan"</p>
              <p><strong>Intercorrência/Entregue:</strong> "Sim" = verdadeiro, qualquer outro valor = falso</p>
              <p><strong>Células com "-":</strong> São ignoradas completamente</p>
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
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{file?.name}</span>
              </p>

              {/* Validation Summary */}
              {validationResult && (
                <>
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

                  {/* Unmatched Members Warning */}
                  {validationResult.unmatchedMembersAll.length > 0 && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-warning">Membros não encontrados</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Os seguintes responsáveis não foram encontrados no sistema. Você pode criar os membros ou associar depois:
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {validationResult.unmatchedMembersAll.map((name) => (
                              <Badge 
                                key={name} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => handleCreateMember(name)}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Criar "{name}"
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
                        <TableHead className="text-xs">Responsáveis</TableHead>
                        <TableHead className="text-xs">Erros/Avisos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.rows.slice(0, 15).map((row, idx) => (
                        <TableRow key={idx} className={!row.valid ? 'bg-destructive/5' : row.warnings.length > 0 ? 'bg-warning/5' : ''}>
                          <TableCell className="text-xs">
                            {row.valid ? (
                              row.warnings.length > 0 ? (
                                <AlertCircle className="w-4 h-4 text-warning" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              )
                            ) : (
                              <X className="w-4 h-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{row.sprint}</TableCell>
                          <TableCell className="text-xs">{row.projeto}</TableCell>
                          <TableCell className="text-xs">{row.demanda}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{row.titulo}</TableCell>
                          <TableCell className="text-xs">
                            {row.responsaveis.map((r, i) => (
                              <Badge 
                                key={i} 
                                variant={row.unmatchedMembers.includes(r) ? 'outline' : 'secondary'} 
                                className="mr-1 mb-1"
                              >
                                {r}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell className="text-xs text-destructive">
                            {row.errors.join(', ')}
                            {row.warnings.length > 0 && (
                              <span className="text-warning">{row.errors.length > 0 ? '; ' : ''}{row.warnings.join(', ')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validationResult.rows.length > 15 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/50">
                      ... e mais {validationResult.rows.length - 15} linhas
                    </div>
                  )}
                </div>
              )}

              {/* Import Mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Modo de importação</Label>
                <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'overwrite' | 'append')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="append" id="append" />
                    <Label htmlFor="append" className="text-sm font-normal cursor-pointer">
                      Adicionar às tarefas existentes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overwrite" id="overwrite" />
                    <Label htmlFor="overwrite" className="text-sm font-normal cursor-pointer">
                      Substituir todas as tarefas
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing || !validationResult?.isValid}
              className="gradient-primary text-white"
            >
              {importing ? 'Importando...' : `Importar ${validationResult?.totalRows || 0} tarefas`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Member Modal */}
      <MemberFormModal
        open={showMemberModal}
        onClose={handleMemberCreated}
        defaultName={pendingMemberName.charAt(0).toUpperCase() + pendingMemberName.slice(1)}
      />
    </>
  );
}