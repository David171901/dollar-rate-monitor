/**
 * Resultado del scraping de tipos de cambio (compra/venta USD-PEN).
 */
export interface TipoCambio {
  compra: number;
  venta: number;
  fuente: string;
  fecha?: string;
}

/**
 * Resultado completo del scraper (éxito o error).
 */
export interface ScraperResult {
  ok: boolean;
  data?: TipoCambio;
  error?: string;
}
