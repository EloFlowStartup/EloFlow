
export interface EntrevistaEmpresa {
  nomeEmpresa: string;
  nomeVaga: string;
  descricaoRotina: string;
  atividades: string[];
  ferramentas: string[];
  habilidadesEsperadas: string[];
  desafiosReais: string[];
}

export interface SimuladorAda {
  titulo: string;
  objetivo: string;
  contexto: string;
  tarefas: {
    titulo: string;
    descricao: string;
    dadosFicticios: Record<string, unknown>;
    habilidadesAvaliadas: string[];
  }[];
}

export function validarEntrevista(
  entrevista: EntrevistaEmpresa,
): string[] {
  const pendencias: string[] = [];

  if (!entrevista.nomeVaga.trim()) {
    pendencias.push("Nome da vaga não informado.");
  }

  if (!entrevista.descricaoRotina.trim()) {
    pendencias.push("Descrição da rotina não informada.");
  }

  if (entrevista.atividades.length === 0) {
    pendencias.push("Nenhuma atividade foi informada.");
  }

  return pendencias;
}
