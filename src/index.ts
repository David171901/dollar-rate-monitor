import "dotenv/config";
import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Falta TELEGRAM_BOT_TOKEN en .env");
  process.exit(1);
}

const bot = new Bot(token);

// Comando /start
bot.command("start", (ctx) => {
  ctx.reply(
    "¡Hola! Soy el bot de monitoreo del dólar.\n\n" +
      "Comandos disponibles:\n" +
      "/start - Ver este mensaje\n" +
      "/dolar - Consultar tipo de cambio (próximamente)\n" +
      "/help - Ayuda",
  );
});

// Comando /help
bot.command("help", (ctx) => {
  ctx.reply(
    "Comandos:\n" +
      "/start - Inicio\n" +
      "/dolar - Tipo de cambio\n" +
      "/help - Esta ayuda",
  );
});

// Comando /dolar — scraping de https://dollarhouse.pe/
bot.command("dolar", async (ctx) => {
  await ctx.reply("Consultando tipo de cambio en DollarHouse…");
  const { scrapeDollarHouse } = await import("./scraper/index.js");
  const result = await scrapeDollarHouse();
  if (result.ok && result.data) {
    const { compra, venta, fuente } = result.data;
    await ctx.reply(
      `💵 *DollarHouse* (dollarhouse.pe)\n\n` +
        `Compra: S/ ${compra.toFixed(4)}\n` +
        `Venta:  S/ ${venta.toFixed(4)}\n\n` +
        `_Fuente: ${fuente}_`,
      { parse_mode: "Markdown" },
    );
  } else {
    await ctx.reply(
      `No se pudo obtener el tipo de cambio.\n${result.error ?? "Error desconocido"}`,
    );
  }
});

// Manejo de mensajes no reconocidos
bot.on("message:text", (ctx) => {
  ctx.reply("Usa /help para ver los comandos disponibles.");
});

// Arranque
bot.start({
  onStart: async (info) => {
    console.log(`Bot activo: @${info.username}`);
    // Cron: cada 20 min, alerta si tipo de cambio (compra) está por debajo del límite
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const priceLimitRaw = process.env.PRICE_LIMIT;
    const priceLimit = priceLimitRaw ? parseFloat(priceLimitRaw) : NaN;
    if (chatId && !Number.isNaN(priceLimit) && priceLimit > 0) {
      const { startPriceAlert } = await import("./cron/index.js");
      startPriceAlert({ bot, chatId, priceLimit });
    } else if (chatId || priceLimitRaw) {
      console.warn(
        "[cron] Para alertas automáticas configura TELEGRAM_CHAT_ID y PRICE_LIMIT en .env",
      );
    }
  },
});

// Manejo de errores
bot.catch((err) => {
  console.error("Error del bot:", err);
});
