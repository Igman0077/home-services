import type { EmailMessage, EmailProvider } from "./types";

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = `console-${Date.now()}`;
    console.info("[email:console]", {
      id,
      to: message.to,
      subject: message.subject,
    });
    return { id };
  }
}
