import { useState, useMemo, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { MemberFormModal } from '@/components/modals/MemberFormModal';
import { useSpreadsheetParser, ParsedTask } from '@/hooks/useSpreadsheetParser';
import { ValidationTable } from '@/components/import/ValidationTable';
import { ValidationSummary } from '@/components/import/ValidationSummary';
import { UnmatchedMembersPanel } from '@/components/import/UnmatchedMembersPanel';

export default function Import() {
  const { projects, members, sprints, importTasks, addMember } = useApp();
  const { parseFile, reset, isLoading, error, result } = useSpreadsheetParser();
  
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [pendingMemberName, setPendingMemberName] = useState('');
  const [ignoredRows, setIgnoredRows] = useState<Set<number>>(new Set());
  const [editedTasks, setEditedTasks] = useState<Map<number, Partial<ParsedTask>>>(new Map());

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

  // Merged tasks with edits applied
  const mergedTasks = useMemo(() => {
    if (!result) return [];
    return result.tasks.map(task => {
      const edits = editedTasks.get(task.rowIndex);
      return edits ? { ...task, ...edits } : task;
    });
  }, [result, editedTasks]);

  // Helper to find member using smart matching
  const findMemberSmartMatch = useCallback((searchName: string): string | null => {
    const normalizedSearch = searchName.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 1. Exact full name match
    const exactMatch = members.find(m => 
      m.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedSearch
    );
    if (exactMatch) return exactMatch.id;

    // 2. Nickname exact match
    const nicknameMatch = members.find(m => 
      m.nickname && m.nickname.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedSearch
    );
    if (nicknameMatch) return nicknameMatch.id;

    // 3. First name match
    const firstNameMatch = members.find(m => {
      const memberFirstName = m.name.split(' ')[0].toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return memberFirstName === normalizedSearch;
    });
    if (firstNameMatch) return firstNameMatch.id;

    // 4. Last name match
    const lastNameMatch = members.find(m => {
      const parts = m.name.split(' ');
      const memberLastName = parts[parts.length - 1].toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return memberLastName === normalizedSearch;
    });
    if (lastNameMatch) return lastNameMatch.id;

    return null;
  }, [members]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIgnoredRows(new Set());
      setEditedTasks(new Map());
      
      const parseResult = await parseFile(selectedFile);
      if (parseResult) {
        setShowModal(true);
      }
    }
  };

  const handleCreateMember = (memberName: string) => {
    setPendingMemberName(memberName);
    setShowMemberModal(true);
  };

  const handleCreateAllMembers = useCallback(async () => {
    if (!result) return;
    
    for (const member of result.unmatchedMembers) {
      const capitalizedName = member.firstName.charAt(0).toUpperCase() + member.firstName.slice(1);
      addMember({
        name: capitalizedName,
        email: `${member.firstName.toLowerCase()}@empresa.com`,
      });
    }
    
    toast({ 
      title: 'Membros criados', 
      description: `${result.unmatchedMembers.length} membro(s) criado(s) com sucesso!` 
    });
    
    // Re-parse to update member matching
    if (file) {
      await parseFile(file);
    }
  }, [result, addMember, file, parseFile]);

  const handleMemberCreated = async () => {
    setShowMemberModal(false);
    setPendingMemberName('');
    // Re-parse file to update member matching
    if (file) {
      await parseFile(file);
    }
  };

  const handleIgnoreRow = useCallback((rowIndex: number) => {
    setIgnoredRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  }, []);

  const handleEditCell = useCallback((rowIndex: number, field: keyof ParsedTask, value: any) => {
    setEditedTasks(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(rowIndex) || {};
      newMap.set(rowIndex, { ...existing, [field]: value });
      return newMap;
    });
  }, []);

  const canImport = useMemo(() => {
    if (!result) return false;
    
    // Check if there are valid tasks after ignoring
    const validTasks = mergedTasks.filter(t => {
      if (ignoredRows.has(t.rowIndex)) return false;
      // Must have projeto, demanda, and titulo
      return t.projeto && t.demanda && t.titulo;
    });
    
    return validTasks.length > 0;
  }, [result, mergedTasks, ignoredRows]);

  const handleImport = async () => {
    if (!result || !canImport) {
      toast({ title: 'Erro', description: 'Corrija os erros antes de importar', variant: 'destructive' });
      return;
    }

    setImporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const tasksToImport = mergedTasks
        .filter(task => !ignoredRows.has(task.rowIndex))
        .filter(task => task.projeto && task.demanda && task.titulo)
        .map(task => {
          // Find or use existing project
          let project = projects.find(p => p.name.toLowerCase() === task.projeto.toLowerCase());
          
          // Find or use existing sprint
          let sprint = sprints.find(s => s.name.toLowerCase() === task.sprint.toLowerCase());
          
          // Find members using smart matching (name, nickname, first/last name)
          const assigneeIds: string[] = [];
          task.responsaveis.forEach(responsavel => {
            const memberId = findMemberSmartMatch(responsavel);
            if (memberId) {
              assigneeIds.push(memberId);
            }
          });

          return {
            projectId: project?.id || 'proj-1',
            sprintId: sprint?.id || 'sprint-1',
            demandId: task.demanda,
            priority: (task.prioridade !== null ? task.prioridade : 3) as 0 | 1 | 2 | 3 | 4 | 5,
            title: task.titulo,
            description: '',
            type: task.tipo,
            category: task.categoria,
            status: task.entregue ? 'done' as const : 'backlog' as const,
            assignees: assigneeIds,
            estimatedHours: task.estimativa,
            hasIncident: task.intercorrencia,
            isDelivered: task.entregue,
            completedAt: task.entregue ? new Date() : undefined,
          };
        });

      importTasks(tasksToImport, importMode);

      const importedCount = tasksToImport.length;
      setImporting(false);
      setShowModal(false);
      setImportResult({
        success: true,
        message: `Planilha importada com sucesso! ${importedCount} tarefas foram ${importMode === 'overwrite' ? 'importadas' : 'adicionadas'}.`
      });
      toast({ title: 'Sucesso', description: `${importedCount} tarefas importadas!` });
      setFile(null);
      reset();
    } catch (err: any) {
      setImporting(false);
      setImportResult({
        success: false,
        message: 'Erro ao importar planilha. Verifique o formato do arquivo.'
      });
      toast({ title: 'Erro', description: 'Falha ao importar planilha', variant: 'destructive' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
    setFile(null);
    setIgnoredRows(new Set());
    setEditedTasks(new Map());
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
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isLoading ? 'Processando planilha...' : 'Arraste e solte sua planilha aqui'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isLoading ? 'A IA está analisando e validando os dados' : 'ou clique para selecionar um arquivo'}
                </p>
                {!isLoading && (
                  <Button variant="outline" disabled={isLoading}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                )}
              </label>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Formatos suportados: .xlsx, .xls, .csv
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="stat-card mt-4 bg-destructive/10 border-destructive/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            </div>
          )}

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
              <p><strong>Prioridade:</strong> p0 = Crítico, p1-p5 = outras prioridades, "-" = ignorar</p>
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

      {/* Import Modal with Visual Validator */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Validação da Importação
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4 pr-2">
              {/* File Info */}
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{file?.name}</span>
              </p>

              {/* Validation Summary */}
              {result && (
                <ValidationSummary 
                  result={result} 
                  ignoredRowsCount={ignoredRows.size} 
                />
              )}

              {/* Unmatched Members */}
              {result && result.unmatchedMembers.length > 0 && (
                <UnmatchedMembersPanel
                  members={result.unmatchedMembers}
                  onCreateMember={handleCreateMember}
                  onCreateAllMembers={handleCreateAllMembers}
                />
              )}

              {/* Validation Table */}
              {result && result.tasks.length > 0 && (
                <ValidationTable
                  tasks={mergedTasks}
                  errors={result.errors}
                  onCreateMember={handleCreateMember}
                  onIgnoreRow={handleIgnoreRow}
                  onEditCell={handleEditCell}
                  ignoredRows={ignoredRows}
                />
              )}

              {/* Import Mode */}
              <div className="space-y-3 pt-2">
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
          </div>

          <DialogFooter className="flex-shrink-0 mt-4 gap-2 border-t pt-4 bg-background">
            <Button variant="outline" onClick={handleCloseModal} disabled={importing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing || !canImport}
              className="gradient-primary text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${mergedTasks.length - ignoredRows.size} tarefas`
              )}
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
