import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export const LanguageSelector = () => {
  const { language, setLanguage, getLanguageName } = useLanguage();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);

  const languages = [
    { code: 'es', name: getLanguageName('es'), flag: '🇪🇸' },
    { code: 'en', name: getLanguageName('en'), flag: '🇬🇧' },
    { code: 'ca', name: getLanguageName('ca'), flag: '🏴' },
    { code: 'fr', name: getLanguageName('fr'), flag: '🇫🇷' },
    { code: 'de', name: getLanguageName('de'), flag: '🇩🇪' },
    { code: 'nl', name: getLanguageName('nl'), flag: '🇳🇱' },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setShowLanguageDialog(true)}
      >
        <Globe className="w-4 h-4" />
        {getLanguageName(language)}
      </Button>

      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar idioma / Select language</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? "default" : "outline"}
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  setLanguage(lang.code as any);
                  setShowLanguageDialog(false);
                }}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {language === lang.code && <span className="text-sm">✓</span>}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
