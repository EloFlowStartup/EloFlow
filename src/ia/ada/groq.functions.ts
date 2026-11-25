import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { criarPromptSimulador } from "./simulatorPrompt";
import type {
  EntrevistaEmpresa,
  SimuladorAda,
  ValorSerializavel,
} from "./index";
import { validarEntrevista } from "./index";

function obterChavesGroq(): string[] {
  const env = process.env as Record<string, string | undefined>;

  return [
    env["GROQ_API_KEY_1"],
    env["GROQ_API_KEY_2"],
    env["GROQ_API_KEY_3"],
  ]
    .map((chave) => chave?.trim())
    .filter((chave): chave is string => Boolean(chave));
}

function formatarValorLegivel(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return "—";
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return String(valor);
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => formatarValorLegivel(item)).join(", ");
  }

  if (typeof valor === "object") {
    const entries = Object.entries(valor as Record<string, unknown>);
    if (entries.length === 0) {
      return "{}";
    }
    return entries
      .map(([k, v]) => `${k}: ${formatarValorLegivel(v)}`)
      .join(" · ");
  }

  return String(valor);
}

function normalizarDadosFicticios(
  raw: unknown,
): Record<string, ValorSerializavel> {
  const resultado: Record<string, ValorSerializavel> = {};

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return resultado;
  }

  for (const [chave, valor] of Object.entries(raw as Record<string, unknown>)) {
    if (
      typeof valor === "string" ||
      typeof valor === "number" ||
      typeof valor === "boolean" ||
      valor === null
    ) {
      resultado[chave] = valor;
    } else if (Array.isArray(valor)) {
      resultado[chave] = valor.map((item) =>
        typeof item === "object" && item !== null
          ? formatarValorLegivel(item)
          : String(item),
      );
    } else if (typeof valor === "object" && valor !== undefined) {
      resultado[chave] = formatarValorLegivel(valor);
    }
  }

  return resultado;
}

function validarEstruturaSimulador(payload: unknown): SimuladorAda {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("A Ada retornou um formato inválido.");
  }

  const obj = payload as Record<string, unknown>;
  const titulo = typeof obj["titulo"] === "string" ? obj["titulo"].trim() : "";
  const objetivo =
    typeof obj["objetivo"] === "string" ? obj["objetivo"].trim() : "";
  const contexto =
    typeof obj["contexto"] === "string" ? obj["contexto"].trim() : "";
  const tarefasRaw = Array.isArray(obj["tarefas"]) ? obj["tarefas"] : [];

  if (!titulo || !contexto || tarefasRaw.length === 0) {
    throw new Error("A Ada retornou um simulador incompleto.");
  }

  const tarefas = tarefasRaw.map((item, idx) => {
    const tarefa = (
      typeof item === "object" && item !== null ? item : {}
    ) as Record<string, unknown>;

    const habilidadesRaw = Array.isArray(tarefa["habilidadesAvaliadas"])
      ? tarefa["habilidadesAvaliadas"]
      : [];

    return {
      titulo:
        typeof tarefa["titulo"] === "string" && tarefa["titulo"].trim()
          ? tarefa["titulo"].trim()
          : `Desafio ${idx + 1}`,
      descricao:
        typeof tarefa["descricao"] === "string" && tarefa["descricao"].trim()
          ? tarefa["descricao"].trim()
          : "Analise o cenário fictício e apresente sua resolução.",
      dadosFicticios: normalizarDadosFicticios(tarefa["dadosFicticios"]),
      habilidadesAvaliadas: habilidadesRaw.filter(
        (h): h is string => typeof h === "string" && h.trim().length > 0,
      ),
    };
  });

  return {
    titulo,
    objetivo: objetivo || "Avaliar habilidades práticas na rotina da vaga.",
    contexto,
    tarefas,
  };
}

async function gerarComGroq(entrevista: EntrevistaEmpresa): Promise<SimuladorAda> {
  const chaves = obterChavesGroq();

  if (chaves.length === 0) {
    throw new Error("Nenhuma chave da Groq foi configurada.");
  }

  const env = process.env as Record<string, string | undefined>;
  const modelo = env["GROQ_MODEL"]?.trim() || "llama-3.3-70b-versatile";

  let ultimoErro: unknown;

  for (const chave of chaves) {
    try {
      const groq = new Groq({ apiKey: chave });

      const resposta = await groq.chat.completions.create({
        model: modelo,
        messages: [
          {
            role: "user",
            content: criarPromptSimulador(entrevista),
          },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      const conteudo = resposta.choices[0]?.message?.content;

      if (!conteudo) {
        throw new Error("A Ada não retornou um simulador.");
      }

      const parsed: unknown = JSON.parse(conteudo);
      return validarEstruturaSimulador(parsed);
    } catch (erro) {
      ultimoErro = erro;

      const status =
        typeof erro === "object" && erro !== null && "status" in erro
          ? (erro as { status?: unknown }).status
          : undefined;

      if (status !== 429 && status !== 401) {
        throw erro;
      }
    }
  }

  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error("Todas as chaves da Groq falharam.");
}

export const gerarSimuladorAda = createServerFn({ method: "POST" })
  .validator((entrevista: EntrevistaEmpresa) => entrevista)
  .handler(async ({ data }) => {
    const pendencias = validarEntrevista(data);

    if (pendencias.length > 0) {
      throw new Error(pendencias.join(" "));
    }

    return await gerarComGroq(data);
  });