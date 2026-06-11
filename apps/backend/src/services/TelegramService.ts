export class TelegramService {
  private readonly token = process.env.TELEGRAM_BOT_TOKEN || "8846118701:AAGxWUV-7iIxNl0U9h1F_4Ucv871o9cgB7Y";
  private readonly chatId = process.env.TELEGRAM_CHAT_ID || "6722078665";
  private readonly apiUrl = `https://api.telegram.org/bot${this.token}/sendMessage`;

  async sendMessage(message: string): Promise<void> {
    if (!this.token || !this.chatId) {
      console.warn("Telegram credentials not configured. Skipping alert.");
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error sending Telegram message:", error);
      }
    } catch (error) {
      console.error("Failed to execute Telegram API request:", error);
    }
  }
}

export const telegramService = new TelegramService();
