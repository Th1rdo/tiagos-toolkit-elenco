/**
 * «Agora clica onde o queres»: um fantasma do token segue o rato sobre o mapa e
 * o clique pousa-o. Esc ou o botão direito desistem.
 *
 * Os cliques vão à frente do Foundry (fase de captura) e não passam para ele:
 * sem isto, o mesmo clique selecionava ou desselecionava tokens por baixo.
 */
export function escolherSitio({ img, tamanho = 1 }) {
  return new Promise((resolve) => {
    const vista = canvas?.app?.view;
    if (!vista) return resolve(null);
    const lado = tamanho * canvas.scene.grid.size * canvas.stage.scale.x;

    const fantasma = document.createElement("div");
    fantasma.className = "elenco-fantasma";
    fantasma.style.width = fantasma.style.height = `${lado}px`;
    fantasma.innerHTML = `<img src="${foundry.utils.escapeHTML(img)}" alt="">`;
    const aviso = document.createElement("div");
    aviso.className = "elenco-aviso";
    aviso.textContent = game.i18n.localize("ELENCO.ClicaOnde");
    document.body.append(fantasma, aviso);

    const mover = (ev) => {
      fantasma.style.transform = `translate(${ev.clientX - lado / 2}px, ${ev.clientY - lado / 2}px)`;
      fantasma.classList.add("elenco-visivel");     // até ao primeiro movimento estaria no canto (0,0)
    };
    const acabar = (valor) => {
      vista.removeEventListener("pointerdown", clicar, true);
      document.removeEventListener("pointermove", mover, true);
      document.removeEventListener("keydown", tecla, true);
      vista.removeEventListener("contextmenu", direito, true);
      fantasma.remove(); aviso.remove();
      resolve(valor);
    };
    const clicar = (ev) => {
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (ev.button === 2) return acabar(null);
      if (ev.button !== 0) return;
      acabar(canvas.canvasCoordinatesFromClient({ x: ev.clientX, y: ev.clientY }));
    };
    const direito = (ev) => { ev.preventDefault(); ev.stopImmediatePropagation(); };
    const tecla = (ev) => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopImmediatePropagation(); acabar(null); } };

    vista.addEventListener("pointerdown", clicar, true);
    vista.addEventListener("contextmenu", direito, true);
    document.addEventListener("pointermove", mover, true);
    document.addEventListener("keydown", tecla, true);
  });
}
