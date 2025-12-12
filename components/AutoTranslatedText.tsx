import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n';
import { translateText } from '../services/geminiService';

interface AutoTranslatedTextProps {
  value: string;      // The English fallback text
  translationKey?: string; // The key to check in i18n.tsx
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
}

// Simple string hash for cache keys
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const AutoTranslatedText: React.FC<AutoTranslatedTextProps> = ({ 
  value, 
  translationKey, 
  className = '', 
  as: Component = 'span' 
}) => {
  const { language, getExactTranslation, findBestTranslation } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<string>(value);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!value) return;

    // 1. If language is English, just show the value
    if (language === 'en') {
      setTranslatedContent(value);
      setIsLoading(false);
      return;
    }

    // 2. Try to get it from i18n (Strict Check via Key)
    if (translationKey) {
      const exactMatch = getExactTranslation(translationKey);
      if (exactMatch) {
        setTranslatedContent(exactMatch);
        setIsLoading(false);
        return;
      }
    }

    // 3. Translation Memory check (Reverse Lookup)
    // This looks for ANY existing translation of the exact same English text.
    // Extremely useful for duplicate products/descriptions.
    const memoryMatch = findBestTranslation(value);
    if (memoryMatch) {
        setTranslatedContent(memoryMatch);
        setIsLoading(false);
        return;
    }

    // 4. Check Local Storage Cache
    // v2 prefix busts old cache from previous buggy versions
    const contentHash = simpleHash(value);
    const cacheKey = `tr_v2_${language}_${contentHash}`; 
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      setTranslatedContent(cached);
      setIsLoading(false);
      return;
    }

    // 5. AI Translation Needed
    setIsLoading(true);

    translateText(value, language)
      .then((result) => {
        if (!mountedRef.current) return;

        // Validation: Only use and cache if result is valid and different from source (unless source was short)
        // If result is null (error) or strictly equals source when language is not source, assume failure or skip caching
        if (result && result !== value) {
            setTranslatedContent(result);
            localStorage.setItem(cacheKey, result);
        } else {
            // API returned null (error) or same string. 
            // We display the English fallback but DO NOT cache it, so we retry next time.
            setTranslatedContent(value);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("AutoTranslate Component Error:", err);
        if (mountedRef.current) {
            setTranslatedContent(value);
            setIsLoading(false);
        }
      });

  }, [language, value, translationKey, getExactTranslation, findBestTranslation]);

  if (isLoading) {
    return (
        <Component className={`${className} opacity-60 animate-pulse`}>
           {translatedContent} 
        </Component>
    );
  }

  return <Component className={className}>{translatedContent}</Component>;
};

export default AutoTranslatedText;