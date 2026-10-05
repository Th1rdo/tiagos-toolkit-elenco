import { TAMANHOS } from "./const.js";
import { lerVida, tamanhoValido } from "./logica.js";

/**
 * O cartão: tudo o que um figurante precisa, num olhar, e Enter cria.
 * Nome já vem do ficheiro; vida é um campo só («12», ou «8/20» para atual/total).
 */
export async function pedir({ img, nome }) {
  const t = (k) => game.i18n.localize(k);
  const esc = foundry.utils.escapeHTML;
  const D = CONST.TOKEN_DISPOSITIONS;
  const disp = [[D.HOSTILE, "ELENCO.Hostil", "hostil"], [D.NEUTRAL, "ELENCO.Neutro", "neutro"], [D.FRIENDLY, "ELENCO.Amigavel", "amigavel"]];
  const conteudo = `
    <div class="elenco-cartao">
      <div class="elenco-retrato"><img src="${esc(img)}" alt=""></div>
      <div class="elenco-campos">
        <label class="elenco-campo elenco-nome"><span>${t("ELENCO.Nome")}</span>
          <input type="text" name="nome" value="${esc(nome)}" autofocus></label>
        <div class="elenco-linha">
          <label class="elenco-campo"><span>${t("ELENCO.Vida")}</span>
            <input type="text" name="vida" placeholder="${t("ELENCO.VidaDica")}" inputmode="numeric"></label>
          <label class="elenco-campo elenco-curto"><span>${t("ELENCO.Quantos")}</span>
            <input type="number" name="quantidade" value="1" min="1" max="20"></label>
        </div>
        <div class="elenco-escolha" role="radiogroup">
          ${disp.map(([v, k, c], i) => `<label class="elenco-pilula elenco-${c}"><input type="radio" name="disposicao" value="${v}" ${i === 0 ? "checked" : ""}><span>${t(k)}</span></label>`).join("")}
        </div>
        <div class="elenco-escolha" role="radiogroup">
          ${TAMANHOS.map((n, i) => `<label class="elenco-pilula"><input type="radio" name="tamanho" value="${n}" ${i === 0 ? "checked" : ""}><span>${n}×${n}</span></label>`).join("")}
        </div>
      </div>
    </div>`;
  const r = await foundry.applications.api.DialogV2.prompt({
    window: { title: "ELENCO.Titulo", icon: "fa-solid fa-user-plus" },
    classes: ["elenco-dialogo"],
    position: { width: 460 },
    content: conteudo,
    ok: { label: "ELENCO.Criar", icon: "fa-solid fa-check", callback: (_ev, botao) => new foundry.applications.ux.FormDataExtended(botao.form).object }
  }).catch(() => null);
  if (!r) return null;
  return {
    nome: String(r.nome ?? "").trim() || nome,
    vida: lerVida(r.vida),
    disposicao: Number(r.disposicao ?? D.HOSTILE),
    quantidade: Math.min(20, Math.max(1, Number(r.quantidade) || 1)),
    tamanho: tamanhoValido(r.tamanho)
  };
}
