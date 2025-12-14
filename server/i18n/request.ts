import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  const locale = await requestLocale || routing.defaultLocale;

  // Load the main messages and all namespaces
  const mainMessages = (await import(`../messages/${locale}.json`)).default;
  // Load all namespace files dynamically using filesystem
  const fs = await import('fs');
  const path = await import('path');
  
  const namespaceMessages: Record<string, Record<string, string>> = {};
  const namespacesDir = path.join(process.cwd(), `messages/${locale}`);
  
  try {
    const files = fs.readdirSync(namespacesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    await Promise.allSettled(
      jsonFiles.map(async (file) => {
        try {
          const namespace = path.basename(file, '.json');
          const messages = (await import(`../messages/${locale}/${file}`)).default;
          namespaceMessages[namespace] = messages;
        } catch {
          // File couldn't be loaded - skip silently
        }
      })
    );
  } catch {
    // Directory doesn't exist - no namespaces to load
  }

  return {
    locale,
    // Combine the messages
    messages: {
      ...mainMessages,
      ...namespaceMessages
    }
  };
}); 