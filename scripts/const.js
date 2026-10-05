/** Identidade do módulo e constantes partilhadas. */
export const MODULE_ID = "tiagos-toolkit-elenco";

/** Para onde vão as imagens largadas do Mac (no Forge: os assets do mestre). */
export const PASTA_ENVIOS = "tiagos-toolkit-elenco";

/** Pasta de atores onde ficam os criados em jogo — não se misturam com os preparados. */
export const PASTA_ATORES = "Criados em jogo";

/** Tamanhos de token, em quadrados da grelha. */
export const TAMANHOS = [1, 2, 3];

/**
 * A barra de vida do Bar Brawl. «custom» = o valor e o máximo vivem no próprio
 * token, sem ficha — é assim que o Tiago usa: põe a vida total e a atual à mão.
 * O estilo é o por omissão do Bar Brawl até se copiar o dos tokens do AKRASIA.
 */
export const BARRA = {
  id: "vida",
  mincolor: "#FF0000",
  maxcolor: "#80FF00",
  position: "bottom-inner",
  // CONST.TOKEN_DISPLAY_MODES.OWNER: o mestre vê sempre, os jogadores (que não são donos de NPCs) não.
  // O Bar Brawl converte este campo nas visibilidades dele na primeira vez que desenha a barra.
  visibility: 40
};

export const log = (...args) => console.log(`${MODULE_ID} |`, ...args);
