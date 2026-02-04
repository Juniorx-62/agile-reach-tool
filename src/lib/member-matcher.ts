import { TeamMember } from '@/types';

/**
 * Normalizes a string for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove accents (unicode normalization)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extracts parts of a name
 */
export function getNameParts(name: string): { first: string; last: string; all: string[] } {
  const parts = normalizeString(name).split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || '',
    last: parts[parts.length - 1] || '',
    all: parts,
  };
}

export interface MatchResult {
  member: TeamMember | null;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  matchedBy: string;
  candidates: TeamMember[];
}

/**
 * Tries to find a member by name using a priority-based matching strategy:
 * 1. Exact full name match
 * 2. First + last name match
 * 3. Nickname exact match
 * 4. First name + nickname partial match
 * 5. Last name + nickname partial match
 * 6. First name only match
 */
export function findMemberByName(
  searchName: string,
  members: TeamMember[]
): MatchResult {
  const normalizedSearch = normalizeString(searchName);
  const searchParts = getNameParts(searchName);
  
  if (!normalizedSearch) {
    return { member: null, confidence: 'none', matchedBy: '', candidates: [] };
  }

  // 1. Exact full name match
  const exactMatch = members.find(m => 
    normalizeString(m.name) === normalizedSearch
  );
  if (exactMatch) {
    return { member: exactMatch, confidence: 'exact', matchedBy: 'nome completo', candidates: [exactMatch] };
  }

  // 2. First + last name match
  const firstLastMatch = members.find(m => {
    const memberParts = getNameParts(m.name);
    return memberParts.first === searchParts.first && memberParts.last === searchParts.last;
  });
  if (firstLastMatch) {
    return { member: firstLastMatch, confidence: 'high', matchedBy: 'primeiro + último nome', candidates: [firstLastMatch] };
  }

  // 3. Nickname exact match
  const nicknameMatch = members.find(m => 
    m.nickname && normalizeString(m.nickname) === normalizedSearch
  );
  if (nicknameMatch) {
    return { member: nicknameMatch, confidence: 'high', matchedBy: 'apelido', candidates: [nicknameMatch] };
  }

  // 4. First name + nickname partial match
  const firstNameCandidates = members.filter(m => {
    const memberParts = getNameParts(m.name);
    const memberNickname = m.nickname ? normalizeString(m.nickname) : '';
    return memberParts.first === normalizedSearch || memberNickname === normalizedSearch;
  });

  if (firstNameCandidates.length === 1) {
    return { 
      member: firstNameCandidates[0], 
      confidence: 'medium', 
      matchedBy: 'primeiro nome', 
      candidates: firstNameCandidates 
    };
  }

  if (firstNameCandidates.length > 1) {
    // Ambiguous - multiple candidates found
    return { 
      member: null, 
      confidence: 'low', 
      matchedBy: 'múltiplas correspondências', 
      candidates: firstNameCandidates 
    };
  }

  // 5. Last name match
  const lastNameCandidates = members.filter(m => {
    const memberParts = getNameParts(m.name);
    return memberParts.last === normalizedSearch;
  });

  if (lastNameCandidates.length === 1) {
    return { 
      member: lastNameCandidates[0], 
      confidence: 'medium', 
      matchedBy: 'sobrenome', 
      candidates: lastNameCandidates 
    };
  }

  if (lastNameCandidates.length > 1) {
    // Ambiguous - multiple candidates found
    return { 
      member: null, 
      confidence: 'low', 
      matchedBy: 'múltiplas correspondências', 
      candidates: lastNameCandidates 
    };
  }

  // 6. Partial nickname match (starts with or contains)
  const partialNicknameMatch = members.filter(m => {
    if (!m.nickname) return false;
    const memberNickname = normalizeString(m.nickname);
    return memberNickname.includes(normalizedSearch) || normalizedSearch.includes(memberNickname);
  });

  if (partialNicknameMatch.length === 1) {
    return { 
      member: partialNicknameMatch[0], 
      confidence: 'medium', 
      matchedBy: 'apelido parcial', 
      candidates: partialNicknameMatch 
    };
  }

  // No match found
  return { member: null, confidence: 'none', matchedBy: '', candidates: [] };
}

/**
 * Finds multiple members from a list of names (e.g., "joao + maria")
 */
export function findMembersFromList(
  namesList: string[],
  members: TeamMember[]
): { matched: TeamMember[]; unmatched: string[]; ambiguous: Array<{ name: string; candidates: TeamMember[] }> } {
  const matched: TeamMember[] = [];
  const unmatched: string[] = [];
  const ambiguous: Array<{ name: string; candidates: TeamMember[] }> = [];

  for (const name of namesList) {
    const result = findMemberByName(name, members);
    
    if (result.member && result.confidence !== 'none') {
      // Avoid duplicates
      if (!matched.find(m => m.id === result.member!.id)) {
        matched.push(result.member);
      }
    } else if (result.candidates.length > 1) {
      ambiguous.push({ name, candidates: result.candidates });
    } else {
      unmatched.push(name);
    }
  }

  return { matched, unmatched, ambiguous };
}
