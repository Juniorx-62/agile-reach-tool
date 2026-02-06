import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TicketType, TicketPriority, TICKET_TYPE_LABELS, TICKET_PRIORITY_LABELS } from '@/types/auth';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authSession } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    ticket_type: '' as TicketType | '',
    priority: 'media' as TicketPriority,
    description: '',
    steps_to_reproduce: '',
    expected_result: '',
    page_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.ticket_type || !formData.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos marcados com *',
        variant: 'destructive',
      });
      return;
    }

    if (formData.ticket_type === 'bug' && !formData.steps_to_reproduce) {
      toast({
        title: 'Passos para reproduzir',
        description: 'Para bugs, é necessário informar os passos para reproduzir.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          partner_id: authSession.partner_id,
          created_by: authSession.user_id,
          title: formData.title,
          ticket_type: formData.ticket_type,
          priority: formData.priority,
          description: formData.description,
          steps_to_reproduce: formData.steps_to_reproduce || null,
          expected_result: formData.expected_result || null,
          page_url: formData.page_url || null,
        });

      if (error) throw error;

      toast({
        title: 'Ticket criado!',
        description: 'Seu chamado foi registrado com sucesso.',
      });

      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erro ao criar ticket',
        description: 'Ocorreu um erro ao criar o ticket.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const showBugFields = formData.ticket_type === 'bug';

  return (
    <div className="min-h-screen bg-background">
      <Header title="Novo Ticket" subtitle="Abra um chamado para a equipe" hideFilters />

      <div className="p-6 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Formulário de Abertura de Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do problema *</Label>
                <Input
                  id="title"
                  placeholder="Descreva brevemente o problema ou solicitação"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de solicitação *</Label>
                  <Select
                    value={formData.ticket_type}
                    onValueChange={(v) => setFormData({ ...formData, ticket_type: v as TicketType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as TicketPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição detalhada *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Bug-specific fields */}
              {showBugFields && (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg border border-dashed space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Informações adicionais para bugs
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="steps">Passos para reproduzir *</Label>
                      <Textarea
                        id="steps"
                        placeholder="1. Acesse a página X&#10;2. Clique no botão Y&#10;3. Observe o erro Z"
                        value={formData.steps_to_reproduce}
                        onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expected">Resultado esperado</Label>
                      <Textarea
                        id="expected"
                        placeholder="Descreva o que deveria acontecer"
                        value={formData.expected_result}
                        onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Page URL */}
              <div className="space-y-2">
                <Label htmlFor="url">URL da página (opcional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.page_url}
                  onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                />
              </div>

              {/* Attachments placeholder */}
              <div className="space-y-2">
                <Label>Anexos (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, PDF até 10MB
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Ticket'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
