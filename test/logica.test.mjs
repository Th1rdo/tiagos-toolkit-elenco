import test from "node:test";
import assert from "node:assert/strict";
import { nomeDoFicheiro, nomesNumerados, lerVida, barra, espalhar, cantoParaCentro, tamanhoValido, eImagem } from "../scripts/logica.js";

test("o nome sai do ficheiro, com maiúscula e sem sublinhados", () => {
  assert.equal(nomeDoFicheiro("MAIN/AKRASIA/Tokens/capanga_02-noite.webp"), "Capanga 02 noite");
  assert.equal(nomeDoFicheiro("https://x/y/Delegado%20Almeida.png?v=2"), "Delegado Almeida");
  assert.equal(nomeDoFicheiro(""), "Figurante");
});

test("vários iguais ganham número; um só não", () => {
  assert.deepEqual(nomesNumerados("Capanga", 3), ["Capanga 1", "Capanga 2", "Capanga 3"]);
  assert.deepEqual(nomesNumerados("Delegado", 1), ["Delegado"]);
  assert.deepEqual(nomesNumerados("X", 0), ["X"]);
});

test("a vida: «12» é 12/12, «8/20» é 8 de 20, vazio é sem barra", () => {
  assert.deepEqual(lerVida("12"), { valor: 12, max: 12 });
  assert.deepEqual(lerVida(" 8 / 20 "), { valor: 8, max: 20 });
  assert.deepEqual(lerVida("30/20"), { valor: 20, max: 20 }, "a atual não passa do total");
  assert.equal(lerVida(""), null);
  assert.equal(lerVida("abc"), null);
  assert.equal(lerVida("0"), null);
});

test("a barra do Bar Brawl é custom, com valor e máximo no token", () => {
  const b = barra({ valor: 8, max: 20 });
  assert.equal(b.vida.attribute, "custom");
  assert.equal(b.vida.value, 8);
  assert.equal(b.vida.max, 20);
  assert.equal(barra(null), null);
  const minha = barra({ valor: 5, max: 5 }, { id: "hp", maxcolor: "#00FF00", position: "top-outer" });
  assert.equal(minha.hp.maxcolor, "#00FF00", "o estilo do mestre ganha ao por omissão");
  assert.equal(minha.hp.position, "top-outer");
  assert.equal(minha.hp.attribute, "custom", "mas o atributo é sempre custom");
});

test("espalhar: o primeiro no sítio, os outros em anel, sem repetidos", () => {
  const p = espalhar(5);
  assert.deepEqual(p[0], { dx: 0, dy: 0 });
  assert.equal(p.length, 5);
  assert.equal(new Set(p.map(q => `${q.dx},${q.dy}`)).size, 5);
  assert.ok(p.slice(1).every(q => Math.max(Math.abs(q.dx), Math.abs(q.dy)) === 1));
  const grandes = espalhar(3, 2);
  assert.ok(grandes.slice(1).every(q => Math.max(Math.abs(q.dx), Math.abs(q.dy)) === 2), "tokens 2×2 não se sobrepõem");
  assert.equal(espalhar(12).length, 12, "passa para o segundo anel quando o primeiro enche");
});

test("o token fica centrado no sítio do rato", () => {
  assert.deepEqual(cantoParaCentro(500, 300, 1, 100), { x: 450, y: 250 });
  assert.deepEqual(cantoParaCentro(500, 300, 2, 100), { x: 400, y: 200 });
  assert.equal(tamanhoValido(7), 1);
});

test("reconhece imagens pelo tipo ou pela extensão", () => {
  assert.ok(eImagem({ type: "image/png", name: "a" }));
  assert.ok(eImagem({ type: "", name: "foto.WEBP" }));
  assert.ok(!eImagem({ type: "application/pdf", name: "a.pdf" }));
});

test("com o estilo do mestre (visibilidades novas do Bar Brawl), o campo antigo «visibility» não vai junto", () => {
  const b = barra({ valor: 5, max: 9 }, { id: "vida", gmVisibility: -1, ownerVisibility: 50, otherVisibility: 0 });
  assert.equal("visibility" in b.vida, false);
  assert.equal(b.vida.ownerVisibility, 50);
  assert.equal("visibility" in barra({ valor: 1, max: 1 }).vida, true, "sem estilo, fica o por omissão (o Bar Brawl converte-o)");
});
