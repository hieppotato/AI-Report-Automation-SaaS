import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { cn } from '../../lib/utils'

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
      <Globe className="w-3.5 h-3.5 text-zinc-400 mx-1" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            "px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer",
            i18n.language === lang.code
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
