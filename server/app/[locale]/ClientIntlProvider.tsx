'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';

interface ClientIntlProviderProps {
  locale: string;
  children: ReactNode;
}

export default function ClientIntlProvider({ locale, children }: ClientIntlProviderProps) {
  const [messages, setMessages] = useState<Record<string, Record<string, string>> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        // Load main messages
        const mainMessages = (await import(`../../messages/${locale}.json`)).default;
        
        // Load feature-specific messages dynamically
        const featureMessages: Record<string, Record<string, string>> = {};
        
        // Try to load common feature namespaces
        // This approach uses dynamic imports which are tree-shaken at build time
        const potentialNamespaces = ['admin', 'assignments', 'users', 'dashboard', 'settings', 'profile'];
        
        // Load each potential namespace
        await Promise.allSettled(
          potentialNamespaces.map(async (namespace) => {
            try {
              const messages = (await import(`../../messages/${locale}/${namespace}.json`)).default;
              featureMessages[namespace] = messages;
              console.info(`Loaded ${namespace} translations for locale ${locale}`);
            } catch {
              // Feature namespace doesn't exist - that's ok, skip silently
            }
          })
        );

        // Combine all messages
        const allMessages = {
          ...mainMessages,
          ...featureMessages
        };

        setMessages(allMessages);
      } catch (error) {
        console.error(`Failed to load messages for locale ${locale}:`, error);
        // Set empty messages to prevent app crash
        setMessages({});
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [locale]);

  if (loading) {
    return <div>Loading translations...</div>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 