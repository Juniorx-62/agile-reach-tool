import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HoursChartProps {
  data: Array<{
    name: string;
    estimated: number;
    completed: number;
  }>;
}

export function HoursChart({ data }: HoursChartProps) {
  return (
    <div className="stat-card h-[300px]">
      <h3 className="text-sm font-semibold text-foreground mb-4">Horas Estimadas vs Concluídas</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="estimatedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number, name: string) => [
              `${Number.isInteger(value) ? value : value.toFixed(1)}h`,
              name === 'estimated' ? 'Estimado' : 'Concluído'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="estimated" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#estimatedGradient)" 
          />
          <Area 
            type="monotone" 
            dataKey="completed" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#completedGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
