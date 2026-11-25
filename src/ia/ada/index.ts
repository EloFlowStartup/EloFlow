export type ValorSerializavel =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[];

export interface EntrevistaEmpresa {
  nomeEmpresa: string;
  nomeVaga: string;
  descricaoRotina: string;
  atividades: string[];
  ferramentas: string[];
  habilidadesEsperadas: string[];
  desafiosReais: string[];
}

export interface TarefaSimuladorAda {
  titulo: string;
  descricao: string;
  dadosFicticios: Record<string, ValorSerializavel>;
  habilidadesAvaliadas: string[];
}

export interface SimuladorAda {
  titulo: string;
  objetivo: string;
  contexto: string;
  tarefas: TarefaSimuladorAda[];
}

export interface DadosVagaParaAda {
  title: string;
  area: string | null;
  seniority: string | null;
  companyName: string | null;
  dna?: {
    summary?: string;
    routine?: string;
    responsibilities?: string[];
    tools?: string[];
    skills?: string[];
    challenges?: string[];
  } | null;
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

export function montarEntrevistaDeVaga(
  vaga: DadosVagaParaAda,
): EntrevistaEmpresa {
  const dna = vaga.dna ?? {};
  const rotinaBase =
    dna.routine?.trim() ||
    dna.summary?.trim() ||
    `Rotina diária da vaga de ${vaga.title} na área de ${vaga.area ?? "Operação"} (${vaga.seniority ?? "Pleno"}).`;

  const atividades =
    dna.responsibilities && dna.responsibilities.length > 0
      ? dna.responsibilities
      : [
          `Organizar prioridades e entregas do dia para ${vaga.title}.`,
          `Tomar decisões práticas com base nas informações disponíveis da rotina.`,
          `Registrar alinhamento e próximos passos de forma clara.`,
        ];

  const habilidadesEsperadas =
    dna.skills && dna.skills.length > 0
      ? dna.skills
      : ["Priorização", "Tomada de decisão", "Comunicação objetiva"];

  const desafiosReais =
    dna.challenges && dna.challenges.length > 0
      ? dna.challenges
      : [`Resolver imprevistos comuns da rotina de ${vaga.title} com dados fictícios.`];

  return {
    nomeEmpresa: vaga.companyName?.trim() || "Empresa parceira",
    nomeVaga: vaga.title,
    descricaoRotina: rotinaBase,
    atividades,
    ferramentas: dna.tools ?? [],
    habilidadesEsperadas,
    desafiosReais,
  };
}