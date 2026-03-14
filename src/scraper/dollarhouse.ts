import axios from "axios";
import * as cheerio from "cheerio";
import type { ScraperResult, TipoCambio } from "./types.js";

const DOLLARHOUSE_URL = "https://app.dollarhouse.pe/";

/**
 * Regex para detectar precios tipo 3.67xx (tipo de cambio PEN).
 */
const RATE_REGEX = /(\d{1,2}\.\d{2,4})/g;

/**
 * Extrae un único valor de tipo de cambio de un texto (ej. "S/ 3.4420" → 3.442).
 */
function parseRate(texto: string): number | null {
  const match = texto.replace(/\s+/g, " ").match(RATE_REGEX);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return n >= 3 && n <= 5 ? n : null;
}

/**
 * Intenta extraer números que parezcan tipo de cambio (ej. 3.67xx) de un texto.
 */
function extraerTasas(texto: string): number[] {
  const matches = texto.match(RATE_REGEX) ?? [];
  return [...new Set(matches.map((m) => parseFloat(m)))].filter(
    (n) => n >= 3 && n <= 5,
  );
}

/**
 * Scrapea la app de DollarHouse (https://app.dollarhouse.pe/) y extrae
 * tipo de cambio compra (#buy-exchange-rate) y venta (#sell-exchange-rate).
 */
export async function scrapeDollarHouse(): Promise<ScraperResult> {
  try {
    const { data: html } = await axios.get<string>(DOLLARHOUSE_URL, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });

    const $ = cheerio.load(html);

    // app.dollarhouse.pe: #buy-exchange-rate (Compra) y #sell-exchange-rate (Venta)
    const compraText = $("#buy-exchange-rate").text().trim();
    const ventaText = $("#sell-exchange-rate").text().trim();
    const compra = parseRate(compraText);
    const venta = parseRate(ventaText);

    if (compra != null && venta != null) {
      return buildResult(compra, venta);
    }

    // Fallback: .exchange-rate.purchase / .exchange-rate.sale (página principal dollarhouse.pe)
    const compraAlt = parseRate($(".exchange-rate.purchase span").text());
    const ventaAlt = parseRate($(".exchange-rate.sale span").text());
    if (compraAlt != null && ventaAlt != null) {
      return buildResult(compraAlt, ventaAlt);
    }

    // Fallback genérico: tasas en el body
    const bodyText = $("body").text();
    const tasasEncontradas = extraerTasas(bodyText);
    if (tasasEncontradas.length >= 2) {
      const ordenadas = [...tasasEncontradas].sort((a, b) => a - b);
      return buildResult(ordenadas[0], ordenadas[ordenadas.length - 1]);
    }
    if (tasasEncontradas.length === 1) {
      const unica = tasasEncontradas[0];
      return buildResult(unica, unica);
    }

    return {
      ok: false,
      error:
        "No se encontraron tasas de cambio en la página. DollarHouse puede cargar los datos por JavaScript.",
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error desconocido al hacer scraping";
    return { ok: false, error: message };
  }
}

function buildResult(compra: number, venta: number): ScraperResult {
  const data: TipoCambio = {
    compra,
    venta,
    fuente: "DollarHouse (dollarhouse.pe)",
    fecha: new Date().toISOString().slice(0, 10),
  };
  return { ok: true, data };
}
