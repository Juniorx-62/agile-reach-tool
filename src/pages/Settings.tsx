import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Database, Save, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';

export default function Settings() {
  const { notificationSettings, updateNotificationSettings, clearDemoData, resetSystem } = useApp();
  const { toast } = useToast();
  const [sprintDuration, setSprintDuration] = useState(14);
  const [isSaving, setIsSaving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    }, 500);
  };

  const handleClearDemoData = async () => {
    setIsClearing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    clearDemoData();
    setIsClearing(false);
    setShowClearModal(false);
    toast({
      title: "Dados limpos",
      description: "Todos os dados de demonstração foram removidos.",
    });
  };

  const handleResetSystem = async () => {
    setIsResetting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    resetSystem();
    setIsResetting(false);
    setShowResetModal(false);
    toast({
      title: "Sistema resetado",
      description: "Todos os dados foram removidos. O sistema está em seu estado inicial.",
    });
  };

  return (
    <>
      <Header 
        title="Configurações" 
        subtitle="Gerencie as configurações do sistema"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Sprint Duration */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Configurações de Sprint</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="sprint-duration">Duração padrão da sprint (dias)</Label>
                <Input 
                  id="sprint-duration"
                  type="number"
                  value={sprintDuration}
                  onChange={(e) => setSprintDuration(Number(e.target.value))}
                  min={1}
                  max={30}
                  className="mt-2 max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será usada como padrão ao criar novas sprints
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-info/10">
                <Bell className="w-5 h-5 text-info" />
              </div>
              <h4 className="font-semibold text-foreground">Notificações</h4>
            </div>
            
            <div className="space-y-4">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Ativar notificações</p>
                  <p className="text-sm text-muted-foreground">Controle geral de todas as notificações</p>
                </div>
                <Switch 
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) => updateNotificationSettings({ enabled: checked })}
                />
              </div>

              <div className={notificationSettings.enabled ? '' : 'opacity-50 pointer-events-none'}>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Tarefas em atraso</p>
                    <p className="text-sm text-muted-foreground">Alertas para tarefas pendentes há mais de 30 dias</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.overdueTasksEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ overdueTasksEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Tarefas pendentes</p>
                    <p className="text-sm text-muted-foreground">Alertas para tarefas pendentes há mais de 7 dias</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.pendingTasksEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ pendingTasksEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Nova tarefa atribuída</p>
                    <p className="text-sm text-muted-foreground">Notificação quando uma tarefa for atribuída</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.assignedTasksEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ assignedTasksEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">Repetição automática (24h)</p>
                    <p className="text-sm text-muted-foreground">Reexibir notificações de atraso após 24 horas se a tarefa ainda estiver pendente</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.autoRepeat24h}
                    onCheckedChange={(checked) => updateNotificationSettings({ autoRepeat24h: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Database className="w-5 h-5 text-warning" />
              </div>
              <h4 className="font-semibold text-foreground">Gerenciamento de Dados</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Limpar dados de demonstração</p>
                  <p className="text-sm text-muted-foreground">Remove todos os dados de exemplo do sistema</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowClearModal(true)}>
                  Limpar
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <p className="font-medium text-foreground">Resetar sistema</p>
                  <p className="text-sm text-muted-foreground">Remove todos os dados permanentemente</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowResetModal(true)}>
                  Resetar
                </Button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            className="w-full gradient-primary text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Check className="w-4 h-4 mr-2 animate-pulse" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Clear Demo Data Modal */}
      <ConfirmationModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearDemoData}
        title="Limpar dados de demonstração"
        description="Esta ação irá remover todos os dados de demonstração do sistema (projetos, sprints, tarefas e membros de exemplo). Os dados criados por você serão mantidos. Deseja continuar?"
        confirmText="Limpar Dados"
        variant="default"
        isLoading={isClearing}
      />

      {/* Reset System Modal */}
      <ConfirmationModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetSystem}
        title="Resetar sistema"
        description="ATENÇÃO: Esta ação irá remover TODOS os dados do sistema permanentemente, incluindo projetos, sprints, tarefas, membros e configurações de notificação. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmText="Resetar Tudo"
        variant="destructive"
        isLoading={isResetting}
      />
    </>
  );
}
