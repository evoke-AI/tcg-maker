import { getTranslations } from 'next-intl/server';

/**
 * Gets translation functions for both global and feature-specific translations.
 * For use in Server Components.
 * 
 * @param locale The current locale
 * @param namespace The feature namespace (e.g., 'admin')
 * @returns Object with translation functions
 */
export async function getFeatureTranslations(locale: string, namespace: string) {
  // Get translation functions
  const featureT = await getTranslations({ 
    locale, 
    namespace
  });
  
  const commonT = await getTranslations({ 
    locale, 
    namespace: 'common' 
  });
  
  // Return both translation functions
  return {
    [namespace]: featureT,
    common: commonT,
  };
}

/**
 * Example usage in a server component:
 * 
 * // In a server component
 * import { getFeatureTranslations } from '@/app/utils/getFeatureTranslations';
 * 
 * export default async function AdminPage({ params: { locale } }) {
 *   const { admin, common } = await getFeatureTranslations(locale, 'admin');
 *   
 *   return (
 *     <div>
 *       <h1>{admin('dashboard.title')}</h1>
 *       <button>{common('save')}</button>
 *     </div>
 *   );
 * }
 */ 