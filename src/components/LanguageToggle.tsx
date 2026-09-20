import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'card';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  variant = 'pill'
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'card') {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={cn(
            "p-3 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 text-left cursor-pointer",
            language === 'id'
              ? "border-brand bg-brand-surface shadow-[0_3px_0_var(--color-brand-dark)]"
              : "border-gray-100 bg-white hover:border-gray-200 text-gray-700"
          )}
        >
          <span className="text-2xl leading-none">🇮🇩</span>
          <div>
            <span className="block font-bold text-sm text-gray-900">Bahasa Indonesia</span>
            <span className="text-xs text-gray-400 font-medium">Indonesia</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={cn(
            "p-3 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 text-left cursor-pointer",
            language === 'en'
              ? "border-brand bg-brand-surface shadow-[0_3px_0_var(--color-brand-dark)]"
              : "border-gray-100 bg-white hover:border-gray-200 text-gray-700"
          )}
        >
          <span className="text-2xl leading-none">🇬🇧</span>
          <div>
            <span className="block font-bold text-sm text-gray-900">English</span>
            <span className="text-xs text-gray-400 font-medium">United States</span>
          </div>
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("inline-flex items-center bg-gray-100/80 p-1 rounded-full border border-gray-200/60 shadow-sm", className)}>
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={cn(
            "px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
            language === 'id'
              ? "bg-white text-brand shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          <span>🇮🇩</span> ID
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={cn(
            "px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
            language === 'en'
              ? "bg-white text-brand shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          <span>🇬🇧</span> EN
        </button>
      </div>
    );
  }

  // Default 'pill' variant
  return (
    <div className={cn("inline-flex items-center bg-gray-100 p-1.5 rounded-2xl border-2 border-gray-200 shadow-inner", className)}>
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={cn(
          "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer",
          language === 'id'
            ? "bg-white text-brand shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-gray-100"
            : "text-gray-500 hover:text-gray-900"
        )}
      >
        <span className="text-base">🇮🇩</span>
        <span>Bahasa Indonesia</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer",
          language === 'en'
            ? "bg-white text-brand shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-gray-100"
            : "text-gray-500 hover:text-gray-900"
        )}
      >
        <span className="text-base">🇬🇧</span>
        <span>English</span>
      </button>
    </div>
  );
};
