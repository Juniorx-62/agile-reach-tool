import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowModal(true);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));
    setImporting(false);
    setShowModal(false);
    setImportResult({
      success: true,
      message: 'Planilha importada com sucesso! 24 tarefas foram adicionadas.'
    });
    setFile(null);
  };

  return (
    <>
      <Header 
        title="Importar Planilha" 
        subtitle="Importe tarefas a partir de uma planilha Excel"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
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

          {/* Instructions */}
          <div className="stat-card mt-6">
            <h4 className="font-semibold text-foreground mb-4">Estrutura da Planilha</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Cada aba da planilha representa uma sprint. As seguintes colunas são obrigatórias:
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
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
              ].map((column) => (
                <div key={column} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{column}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Arquivo selecionado: <span className="font-medium text-foreground">{file?.name}</span>
            </p>

            <div className="space-y-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing}
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
