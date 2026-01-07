import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
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

type ExportType = 'project' | 'sprint' | 'member' | 'general';
type ExportFormat = 'pdf' | 'excel';

const exportTypes: { value: ExportType; label: string; description: string }[] = [
  { value: 'project', label: 'Por Projeto', description: 'Exportar todas as tarefas de um projeto específico' },
  { value: 'sprint', label: 'Por Sprint', description: 'Exportar todas as tarefas de uma sprint específica' },
  { value: 'member', label: 'Por Membro', description: 'Exportar todas as tarefas de um membro específico' },
  { value: 'general', label: 'Relatório Geral', description: 'Exportar visão geral de todos os dados' },
];

export default function Export() {
  const { projects, sprints, members } = useApp();
  const [exportType, setExportType] = useState<ExportType>('general');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [selectedId, setSelectedId] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExporting(false);
    // In a real app, this would trigger a file download
    alert('Relatório exportado com sucesso!');
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
              <h4 className="font-semibold text-foreground mb-4">Selecionar {exportType === 'project' ? 'Projeto' : exportType === 'sprint' ? 'Sprint' : 'Membro'}</h4>
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
            disabled={exporting || (needsFilter && !selectedId)}
            className="w-full gradient-primary text-white py-6 text-lg"
          >
            {exporting ? (
              'Gerando relatório...'
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
