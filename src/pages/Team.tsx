import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MemberCard } from '@/components/team/MemberCard';
import { MemberDetailModal } from '@/components/team/MemberDetailModal';
import { useApp } from '@/contexts/AppContext';
import { TeamMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Team() {
  const { members } = useApp();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header 
        title="Equipe" 
        subtitle={`${members.length} membros`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar membro..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Membro
          </Button>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard 
              key={member.id} 
              member={member}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Nenhum membro encontrado</p>
          </div>
        )}
      </div>

      <MemberDetailModal
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}
