import { Settings as SettingsIcon, Bell, Database, Palette } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Settings() {
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
                  defaultValue={14}
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

          {/* Notifications (Future) */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-info/10">
                <Bell className="w-5 h-5 text-info" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Notificações</h4>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
            
            <div className="space-y-4 opacity-50 pointer-events-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Nova tarefa atribuída</p>
                  <p className="text-sm text-muted-foreground">Receba notificação quando uma tarefa for atribuída a você</p>
                </div>
                <Switch disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Tarefa próxima do prazo</p>
                  <p className="text-sm text-muted-foreground">Alerta 2 dias antes do fim da sprint</p>
                </div>
                <Switch disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Tarefa atrasada</p>
                  <p className="text-sm text-muted-foreground">Alerta quando a sprint terminar com tarefas pendentes</p>
                </div>
                <Switch disabled />
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
                <Button variant="outline" size="sm">
                  Limpar
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <p className="font-medium text-foreground">Resetar sistema</p>
                  <p className="text-sm text-muted-foreground">Remove todos os dados permanentemente</p>
                </div>
                <Button variant="destructive" size="sm">
                  Resetar
                </Button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button className="w-full gradient-primary text-white">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </>
  );
}
