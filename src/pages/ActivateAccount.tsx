import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoFull from '@/assets/logo-full.png';

interface TokenValidation {
  valid: boolean;
  user?: {
    name: string;
    email: string;
    expires_at: string;
  };
  error?: string;
}

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  const userType = searchParams.get('type') as 'internal' | 'partner' | null;
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<TokenValidation['user'] | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !userType) {
        setTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-token', {
          body: { token, user_type: userType },
        });

        if (error) {
          console.error('Token validation error:', error);
          setTokenValid(false);
        } else if (data.valid) {
          setTokenValid(true);
          setUserInfo(data.user);
          setName(data.user.name || '');
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Validation error:', error);
        setTokenValid(false);
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [token, userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !password || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas digitadas não são iguais.',
        variant: 'destructive',
      });
      return;
    }

    setIsActivating(true);

    try {
      const { data, error } = await supabase.functions.invoke('activate-account', {
        body: { 
          token, 
          user_type: userType,
          password,
          name,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Erro ao ativar conta');
      }

      toast({
        title: 'Conta ativada!',
        description: 'Sua conta foi ativada com sucesso. Faça login para continuar.',
      });

      navigate('/auth');
    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: 'Erro na ativação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao ativar sua conta.',
        variant: 'destructive',
      });
    }

    setIsActivating(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Convite inválido</h2>
            <p className="text-muted-foreground">
              Este link de convite é inválido ou expirou. Por favor, solicite um novo convite ao administrador.
            </p>
            <Button onClick={() => navigate('/auth')} variant="outline" className="mt-4">
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <img src={logoFull} alt="4Selet" className="h-12" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Ativar sua conta</CardTitle>
            <CardDescription className="mt-2">
              {userInfo?.email && (
                <span className="block text-foreground font-medium">{userInfo.email}</span>
              )}
              Configure sua senha para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">As senhas não conferem</p>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <p className="text-sm text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isActivating || password !== confirmPassword}
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                'Ativar minha conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
