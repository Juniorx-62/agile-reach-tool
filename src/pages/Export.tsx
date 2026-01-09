import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format as formatDate } from 'date-fns';
import autoTable from 'jspdf-autotable';
import { ptBR } from 'date-fns/locale';

type ExportType = 'project' | 'sprint' | 'member' | 'general';
type ExportFormat = 'pdf' | 'excel';

const exportTypes: { value: ExportType; label: string; description: string }[] = [
  { value: 'project', label: 'Por Projeto', description: 'Exportar todas as tarefas de um projeto específico' },
  { value: 'sprint', label: 'Por Sprint', description: 'Exportar todas as tarefas de uma sprint específica' },
  { value: 'member', label: 'Por Membro', description: 'Exportar todas as tarefas de um membro específico' },
  { value: 'general', label: 'Relatório Geral', description: 'Exportar visão geral de todos os dados' },
];

const priorityLabels: Record<number, string> = {
  0: 'P0 - Crítica',
  1: 'P1 - Muito Alta',
  2: 'P2 - Alta',
  3: 'P3 - Média',
  4: 'P4 - Baixa',
  5: 'P5 - Muito Baixa',
};

const typeLabels: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
};

const categoryLabels: Record<string, string> = {
  feature: 'Feature',
  bug: 'Bug',
  refinement: 'Refinamento',
};

export default function Export() {
  const { projects, sprints, members, tasks } = useApp();
  const [exportType, setExportType] = useState<ExportType>('general');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [selectedId, setSelectedId] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const getFilteredTasks = () => {
    switch (exportType) {
      case 'project':
        return tasks.filter(t => t.projectId === selectedId);
      case 'sprint':
        return tasks.filter(t => t.sprintId === selectedId);
      case 'member':
        return tasks.filter(t => t.assignees.includes(selectedId));
      default:
        return tasks;
    }
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'project':
        const project = projects.find(p => p.id === selectedId);
        return `Relatório - ${project?.name || 'Projeto'}`;
      case 'sprint':
        const sprint = sprints.find(s => s.id === selectedId);
        return `Relatório - ${sprint?.name || 'Sprint'}`;
      case 'member':
        const member = members.find(m => m.id === selectedId);
        return `Relatório - ${member?.name || 'Membro'}`;
      default:
        return 'Relatório Geral';
    }
  };

  const prepareExportData = () => {
    const filteredTasks = getFilteredTasks();
    
    return filteredTasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const sprint = sprints.find(s => s.id === task.sprintId);
      const assignees = task.assignees
        .map(id => members.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      return {
        'Projeto': project?.name || '',
        'Sprint': sprint?.name || '',
        'Demanda': task.demandId,
        'Título': task.title,
        'Prioridade': priorityLabels[task.priority],
        'Tipo': typeLabels[task.type],
        'Categoria': categoryLabels[task.category],
        'Responsáveis': assignees,
        'Estimativa (h)': task.estimatedHours,
        'Intercorrência': task.hasIncident ? 'Sim' : 'Não',
        'Entregue': task.isDelivered ? 'Sim' : 'Não',
        'Criação': format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: ptBR }),
        'Conclusão': task.completedAt ? format(new Date(task.completedAt), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      };
    });
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    const title = getExportTitle();
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row]).length))
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const data = prepareExportData();
    const title = getExportTitle();
    
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 14, 30);
    
    // Stats summary
    const filteredTasks = getFilteredTasks();
    const completed = filteredTasks.filter(t => t.isDelivered).length;
    const totalHours = filteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const completedHours = filteredTasks.filter(t => t.isDelivered).reduce((sum, t) => sum + t.estimatedHours, 0);
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Total de Tarefas: ${filteredTasks.length} | Concluídas: ${completed} | Horas Estimadas: ${totalHours}h | Horas Concluídas: ${completedHours}h`, 14, 38);
    
    // Table
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => Object.values(row));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 97, 227] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    
    doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (format === 'excel') {
        exportToExcel();
      } else {
        exportToPDF();
      }
      
      toast({ title: 'Sucesso', description: 'Relatório exportado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar relatório', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const getFilterOptions = () => {
    switch (exportType) {
      case 'project':
        return projects.map(p => ({ value: p.id, label: p.name }));
      case 'sprint':
        return sprints.map(s => ({ value: s.id, label: s.name }));
      case 'member':
        return members.map(m => ({ value: m.id, label: m.name }));
      default:
        return [];
    }
  };

  const needsFilter = exportType !== 'general';
  const filterOptions = getFilterOptions();
  const previewCount = getFilteredTasks().length;

  return (
    <>
      <Header 
        title="Exportar Relatórios" 
        subtitle="Gere relatórios em PDF ou Excel"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Export Type Selection */}
          <div className="stat-card">
            <h4 className="font-semibold text-foreground mb-4">Tipo de Relatório</h4>
            <div className="grid grid-cols-2 gap-3">
              {exportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setExportType(type.value);
                    setSelectedId('');
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    exportType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-medium text-foreground">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Selection */}
          {needsFilter && (
            <div className="stat-card">
              <h4 className="font-semibold text-foreground mb-4">
                Selecionar {exportType === 'project' ? 'Projeto' : exportType === 'sprint' ? 'Sprint' : 'Membro'}
              </h4>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview Info */}
          <div className="stat-card bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tarefas a serem exportadas:</span>
              <span className="font-semibold text-foreground">{previewCount} tarefas</span>
            </div>
          </div>

          {/* Format Selection */}
          <div className="stat-card">
            <h4 className="font-semibold text-foreground mb-4">Formato de Exportação</h4>
            <div className="flex gap-4">
              <button
                onClick={() => setFormat('excel')}
                className={cn(
                  'flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all',
                  format === 'excel'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="p-2 rounded-lg bg-success/10">
                  <FileSpreadsheet className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx</p>
                </div>
                {format === 'excel' && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={cn(
                  'flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all',
                  format === 'pdf'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="p-2 rounded-lg bg-destructive/10">
                  <FileText className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">PDF</p>
                  <p className="text-xs text-muted-foreground">.pdf</p>
                </div>
                {format === 'pdf' && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport}
            disabled={exporting || (needsFilter && !selectedId) || previewCount === 0}
            className="w-full gradient-primary text-white py-6 text-lg"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando relatório...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Exportar Relatório
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
