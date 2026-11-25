
import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { criarPromptSimulador } from "./simulatorPrompt";
import type { EntrevistaEmpresa } from "./index";
import { validarEntrevista } from "./index";

function obterChavesGroq(): string[] {
  return [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter((chave): chave is string => Boolean(chave));
}

async function gerarComGroq(entrevista: EntrevistaEmpresa) {
  const chaves = obterChavesGroq();

  if (chaves.length === 0) {
    throw new Error("Nenhuma chave da Groq foi configurada.");
  }

  let ultimoErro: unknown;

  for (const chave of chaves) {
    try {
      const groq = new Groq({ apiKey: chave });

      const resposta = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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

      return JSON.parse(conteudo);
    } catch (erro) {
      ultimoErro = erro;

      const status =
        typeof erro === "object" && erro !== null && "status" in erro
          ? erro.status
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
