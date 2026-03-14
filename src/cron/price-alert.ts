import type { Bot } from "grammy";
import { scrapeDollarHouse } from "../scraper/index.js";

const INTERVAL_MS = 20 * 60 * 1000; // 20 minutos
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora entre alertas para no spamear

let lastAlertAt: number | null = null;

export interface PriceAlertConfig {
  bot: Bot;
  chatId: string;
  /** Límite en soles: alerta si el tipo de cambio (compra) está por debajo de este valor */
  priceLimit: number;
}

/**
 * Comprueba el precio en DollarHouse y envía un mensaje a Telegram
 * si el tipo de cambio de compra está por debajo de priceLimit.
 */
async function checkAndAlert(config: PriceAlertConfig): Promise<void> {
  const { bot, chatId, priceLimit } = config;
  const result = await scrapeDollarHouse();

  if (!result.ok || !result.data) {
    console.warn("[priceAlert] No se pudo obtener tipo de cambio:", result.error);
    return;
  }

  const { compra, venta, fuente } = result.data;
  const now = Date.now();
  const inCooldown = lastAlertAt != null && now - lastAlertAt < COOLDOWN_MS;

  if (compra >= priceLimit) return;
  if (inCooldown) return;

  lastAlertAt = now;
  const text =
    `🔔 *Alerta: tipo de cambio por debajo de tu límite*\n\n` +
    `Límite configurado: S/ ${priceLimit.toFixed(4)}\n` +
    `Compra actual: S/ ${compra.toFixed(4)}\n` +
    `Venta actual:  S/ ${venta.toFixed(4)}\n\n` +
    `_${fuente}_`;

  try {
    await bot.api.sendMessage(chatId, text, { parse_mode: "Markdown" });
    console.log("[priceAlert] Alerta enviada: compra", compra, "<", priceLimit);
  } catch (err) {
    console.error("[priceAlert] Error al enviar mensaje:", err);
    lastAlertAt = null; // permitir reintento en la siguiente pasada
  }
}

/**
 * Inicia el job que cada 20 minutos consulta DollarHouse y envía
 * un mensaje al chat indicado si el tipo de cambio de compra está por debajo del límite.
 */
export function startPriceAlert(config: PriceAlertConfig): NodeJS.Timeout {
  const run = () => checkAndAlert(config).catch((err) => console.error("[priceAlert]", err));
  run(); // primera ejecución al arrancar
  const intervalId = setInterval(run, INTERVAL_MS);
  console.log(
    `[priceAlert] Activo: cada 20 min, alerta si compra < S/ ${config.priceLimit.toFixed(4)}`,
  );
  return intervalId;
}
