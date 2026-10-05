import { MODULE_ID, log } from "./const.js";
import { nomeDoFicheiro, eImagem } from "./logica.js";
import { registarDefinicoes, enviarImagem, escolherImagem, criar, trocarImagem, copiarEstilo } from "./dados.js";
import { pedir } from "./cartao.js";
import { escolherSitio } from "./colocar.js";

/**
 * Figurantes a meio da sessão, em dois gestos:
 *
 *  1. Largar uma imagem do Mac no mapa → cartão (nome, vida…) → Enter → ator e
 *     token criados onde se largou. Largar em cima de um token troca-lhe a imagem.
 *  2. Botão «Novo token» → o navegador de ficheiros normal → cartão → clicar no
 *     mapa onde o queres.
 */

const aviso = (k, dados) => ui.notifications.info(game.i18n.format(k, dados ?? {}));

/** O fluxo comum depois de haver imagem: cartão, sítio (se ainda não houver) e criar. */
async function novo(img, sitio = null, nome = nomeDoFicheiro(img)) {
  if (!game.user.isGM || !canvas?.scene) return;
  const escolha = await pedir({ img, nome });
  if (!escolha) return;
  const ponto = sitio ?? await escolherSitio({ img, tamanho: escolha.tamanho });
  if (!ponto) return;
  const { tokens } = await criar({ img, ...escolha, x: ponto.x, y: ponto.y });
  aviso(tokens.length > 1 ? "ELENCO.Criados" : "ELENCO.Criado", { nome: escolha.nome, n: tokens.length });
}

/** Botão / atalho: o navegador de ficheiros normal. */
async function escolherENovo() {
  if (!game.user.isGM) return;
  const img = await escolherImagem();
  if (img) await novo(img);
}

// ---------------------------------------------------------------- largar do Mac no mapa

/** O token que está debaixo de um ponto da cena (o de cima, se houver vários). */
function tokenEm(ponto) {
  return canvas.tokens.placeables
    .filter(t => t.visible && t.bounds.contains(ponto.x, ponto.y))
    .sort((a, b) => b.document.sort - a.document.sort || b.zIndex - a.zIndex)[0] ?? null;
}

/**
 * Ficheiros largados do Mac sobre o mapa. O Foundry faria disto um tile (ou nada);
 * aqui fica um token. Vai em fase de captura e pára aí para o Foundry não fazer as duas coisas.
 */
async function aoLargar(ev) {
  if (!game.user.isGM || ev.target !== canvas?.app?.view) return;
  const ficheiro = [...(ev.dataTransfer?.files ?? [])].find(eImagem);
  if (!ficheiro) return;
  ev.preventDefault();
  ev.stopImmediatePropagation();
  const ponto = canvas.canvasCoordinatesFromClient({ x: ev.clientX, y: ev.clientY });
  const alvo = tokenEm(ponto);
  let img;
  try {
    img = await enviarImagem(ficheiro);
  } catch (e) {
    return ui.notifications.error(game.i18n.format("ELENCO.FalhouEnvio", { erro: e.message }));
  }
  if (alvo) {
    await trocarImagem(alvo.document, img);
    return aviso("ELENCO.ImagemTrocada", { nome: alvo.document.name });
  }
  // o nome vem do ficheiro original: o enviado leva um código à frente para não pisar outros
  await novo(img, ponto, nomeDoFicheiro(ficheiro.name));
}

Hooks.once("init", () => {
  registarDefinicoes();
  game.keybindings.register(MODULE_ID, "novo", {
    name: "ELENCO.Atalho", hint: "ELENCO.AtalhoDica",
    editable: [], restricted: true,
    onDown: () => { escolherENovo(); return true; }
  });
});

Hooks.once("ready", () => {
  document.addEventListener("drop", aoLargar, true);
  game.elenco = { novo: escolherENovo, criar, copiarEstilo };
  log("pronto");
});

// o botão nas ferramentas dos tokens
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM || Array.isArray(controls)) return;
  const grupo = controls.tokens ?? Object.values(controls)[0];
  if (!grupo?.tools) return;
  grupo.tools.elencoNovo = {
    name: "elencoNovo",
    order: Object.keys(grupo.tools).length + 1,
    title: "ELENCO.Novo",
    icon: "fa-solid fa-user-plus",
    button: true, visible: true,
    onChange: () => escolherENovo()
  };
});

// no HUD de um token: «usar estas barras como modelo» (copia o estilo do Bar Brawl dele)
Hooks.on("renderTokenHUD", (hud, html) => {
  if (!game.user.isGM || !game.modules.get("barbrawl")?.active) return;
  const el = html instanceof HTMLElement ? html : html[0];
  const col = el?.querySelector(".col.right");
  if (!col || col.querySelector(".elenco-modelo")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "control-icon elenco-modelo";
  b.dataset.tooltip = "ELENCO.UsarModelo";
  b.innerHTML = `<i class="fa-solid fa-heart-pulse"></i>`;
  b.addEventListener("click", async (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    const r = await copiarEstilo(hud.document ?? hud.object?.document);
    if (r) aviso("ELENCO.ModeloGuardado");
    else ui.notifications.warn(game.i18n.localize("ELENCO.SemBarras"));
  });
  col.appendChild(b);
});
