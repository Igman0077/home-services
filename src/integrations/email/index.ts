import type { EmailProvider } from "@/integrations/email/types";
import { ConsoleEmailProvider } from "@/integrations/email/console";

let emailProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;

  const provider = process.env.EMAIL_PROVIDER ?? "console";
  switch (provider) {
    case "console":
    default:
      emailProvider = new ConsoleEmailProvider();
      return emailProvider;
  }
}
