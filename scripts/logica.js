/**
 * Lógica pura do elenco: sem Foundry, sem DOM — testada em Node.
 */
import { BARRA, TAMANHOS } from "./const.js";

/** «capanga_02-noite.webp» → «Capanga 02 noite». A primeira letra em maiúscula: é o nome de alguém. */
export function nomeDoFicheiro(caminho) {
  const base = decodeURIComponent(String(caminho ?? "").split(/[?#]/)[0].split("/").pop() || "");
  const limpo = base.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return limpo ? limpo[0].toUpperCase() + limpo.slice(1) : "Figurante";
}

/** Vários iguais: «Capanga» ×3 → Capanga 1, Capanga 2, Capanga 3. Um só fica sem número. */
export function nomesNumerados(nome, quantidade) {
  const n = Math.max(1, Math.floor(quantidade) || 1);
  return n === 1 ? [nome] : Array.from({ length: n }, (_, i) => `${nome} ${i + 1}`);
}

/**
 * A vida escrita no cartão: «12» → 12; vazio → sem barra. Aceita «12/20» (atual/total)
 * porque é assim que o Tiago escreve vida em papel.
 */
export function lerVida(texto) {
  const t = String(texto ?? "").trim();
  if (!t) return null;
  const m = /^(\d+)\s*(?:\/\s*(\d+))?$/.exec(t);
  if (!m) return null;
  const a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]);
  if (!(b > 0)) return null;
  return { valor: Math.min(a, b), max: b };
}

/** A barra do Bar Brawl com a vida deste token. `estilo` = o dos tokens do mestre, se já o tivermos. */
export function barra(vida, estilo = {}) {
  if (!vida) return null;
  const { id, ...resto } = { ...BARRA, ...estilo };
  // o estilo copiado já traz as visibilidades novas do Bar Brawl; o «visibility» antigo do
  // por omissão seria convertido outra vez e podia passar por cima da escolha do mestre
  if ("otherVisibility" in estilo || "ownerVisibility" in estilo) delete resto.visibility;
  return { [id]: { ...resto, id, order: 0, attribute: "custom", value: vida.valor, max: vida.max } };
}

export const tamanhoValido = (t) => (TAMANHOS.includes(Number(t)) ? Number(t) : 1);

/**
 * Onde pousam N tokens à volta do sítio clicado: o primeiro no sítio, os outros
 * em anel à volta, um quadrado de distância (anéis maiores se não couberem).
 * Devolve deslocamentos em quadrados da grelha, inteiros, sem repetidos.
 */
export function espalhar(quantidade, tamanho = 1) {
  const n = Math.max(1, Math.floor(quantidade) || 1);
  const passo = tamanhoValido(tamanho);
  const pos = [[0, 0]];
  for (let anel = 1; pos.length < n; anel++) {
    for (let dy = -anel; dy <= anel && pos.length < n; dy++) {
      for (let dx = -anel; dx <= anel && pos.length < n; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== anel) continue;   // só a casca deste anel
        pos.push([dx, dy]);
      }
    }
  }
  return pos.map(([dx, dy]) => ({ dx: dx * passo, dy: dy * passo }));
}

/** O canto superior esquerdo de um token centrado num ponto (o rato ou o largar). */
export function cantoParaCentro(x, y, tamanho, grelha) {
  const lado = tamanhoValido(tamanho) * grelha;
  return { x: x - lado / 2, y: y - lado / 2 };
}

/** É uma imagem que dá token? (O Foundry também aceita vídeo como textura.) */
export const eImagem = (ficheiro) =>
  /^image\//.test(ficheiro?.type ?? "") || /\.(png|jpe?g|webp|gif|avif|svg|webm|mp4)$/i.test(ficheiro?.name ?? "");
