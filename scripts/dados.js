import { MODULE_ID, PASTA_ENVIOS, PASTA_ATORES, BARRA } from "./const.js";
import { nomesNumerados, barra, espalhar, cantoParaCentro, tamanhoValido } from "./logica.js";

/**
 * Criar no mundo: ator + token(s) num passo, sem ficha.
 *
 * O Tiago não usa a ficha do sistema: um token é uma imagem com um nome e uma
 * barra de vida do Bar Brawl. Antes, cada um custava criar o ator, trocar a
 * imagem do ator, trocar outra vez a do token e configurar a barra.
 */

export function registarDefinicoes() {
  // o estilo das barras dos tokens do mestre, copiado de um token dele (ver copiarEstilo)
  game.settings.register(MODULE_ID, "estiloBarra", { scope: "world", config: false, type: Object, default: {} });
}

const estilo = () => game.settings.get(MODULE_ID, "estiloBarra") ?? {};

// ---------------------------------------------------------------- imagens

const FP = () => foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
const fonte = () => (globalThis.ForgeVTT?.usingTheForge ? "forgevtt" : "data");

/** Enviar uma imagem do Mac para o servidor (no Forge, para os assets do mestre). Devolve o caminho. */
export async function enviarImagem(ficheiro) {
  const fp = FP();
  try { await fp.createDirectory(fonte(), PASTA_ENVIOS, {}); } catch { /* já existe */ }
  // nome único: «IMG_0001.png» de hoje não pisa o de ontem
  const nome = `${Date.now().toString(36)}-${ficheiro.name.replace(/[^\w.\-]+/g, "_")}`;
  const r = await fp.upload(fonte(), PASTA_ENVIOS, new File([ficheiro], nome, { type: ficheiro.type }), {}, { notify: false });
  const caminho = r?.path ?? r?.url;
  if (!caminho) throw new Error(r?.message ?? "o envio falhou");
  return caminho;
}

/** O navegador de ficheiros normal do Foundry (no Forge, o dele). Resolve com o caminho, ou null. */
export function escolherImagem() {
  return new Promise((resolve) => {
    const F = FP();
    const fp = new F({ type: "image", callback: (c) => resolve(c) });
    // fechar o navegador sem escolher não pode deixar o gesto pendurado
    const fechar = fp.close.bind(fp);
    fp.close = async (...a) => { setTimeout(() => resolve(null), 0); return fechar(...a); };
    fp.render(true);
  });
}

// ---------------------------------------------------------------- criar

async function pastaDeAtores() {
  return game.folders.find(f => f.type === "Actor" && f.name === PASTA_ATORES)
    ?? Folder.create({ name: PASTA_ATORES, type: "Actor", color: "#3d2b4f" });
}

/** O tipo de ator: «ameaça» no Ordem Paranormal; noutro sistema, o primeiro que houver. */
function tipoDeAtor() {
  const tipos = Object.keys(CONFIG.Actor.dataModels ?? {}).concat(game.documentTypes?.Actor ?? []).filter(t => t !== "base");
  return tipos.includes("threat") ? "threat" : (tipos[0] ?? "base");
}

/**
 * Cria um ator e N tokens dele na cena atual, à volta do ponto (coordenadas da cena).
 * Com mais de um, os tokens são independentes (não ligados ao ator): cada capanga tem a sua vida.
 */
export async function criar({ img, nome, vida, disposicao, quantidade = 1, tamanho = 1, x, y }) {
  const lado = tamanhoValido(tamanho);
  const pasta = await pastaDeAtores();
  const muitos = quantidade > 1;
  const barras = barra(vida, estilo());
  const base = {
    name: nome,
    texture: { src: img },
    width: lado, height: lado,
    disposition: disposicao,
    actorLink: !muitos,
    sight: { enabled: false },          // NPC: a visão de um figurante só gasta GPU
    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    ...(barras ? { flags: { barbrawl: { resourceBars: barras } } } : {})
  };

  const ator = await Actor.create({
    name: nome, type: tipoDeAtor(), img, folder: pasta.id,
    prototypeToken: base
  });

  const scene = canvas.scene;
  if (!scene) return { ator, tokens: [] };
  const g = scene.grid.size;
  const nomes = nomesNumerados(nome, quantidade);
  const centro = cantoParaCentro(x, y, lado, g);
  const dados = espalhar(nomes.length, lado).map((d, i) => {
    const alvo = { x: centro.x + d.dx * g, y: centro.y + d.dy * g };
    const encaixado = canvas.grid.getSnappedPoint?.(alvo, { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER }) ?? alvo;
    return { ...base, name: nomes[i], actorId: ator.id, x: encaixado.x, y: encaixado.y };
  });
  const tokens = await scene.createEmbeddedDocuments("Token", dados);
  return { ator, tokens };
}

/** Largar uma imagem nova em cima de um token: troca no token, no ator e no token-modelo do ator. */
export async function trocarImagem(tokenDoc, img) {
  // o ator primeiro e o token por último: no Foundry local (Ordem Paranormal 7.2.4 partido no v14) a
  // preparação do ator rebentava e deixava o token ligado a desenhar a imagem velha até recarregar
  const ator = tokenDoc.actorId ? game.actors.get(tokenDoc.actorId) : null;
  if (ator) await ator.update({ img, "prototypeToken.texture.src": img });
  await tokenDoc.update({ "texture.src": img });
}

/**
 * Usar as barras de um token como modelo para os próximos. Guarda só o estilo
 * (cores, posição, visibilidades), nunca a vida nem o atributo.
 */
export async function copiarEstilo(tokenDoc) {
  const barras = tokenDoc?.getFlag?.("barbrawl", "resourceBars") ?? {};
  const primeira = Object.values(barras).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  if (!primeira) return null;
  const { value, max, attribute, order, ...resto } = primeira;
  const novo = { ...resto, id: resto.id ?? BARRA.id };
  await game.settings.set(MODULE_ID, "estiloBarra", novo);
  return novo;
}
