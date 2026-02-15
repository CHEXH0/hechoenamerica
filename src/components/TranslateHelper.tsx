import { useState } from "react";
import { Globe, X, Chrome, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const translatedIntros: { lang: string; text: string }[] = [
  { lang: "ES", text: "Usa la función de traducción de tu navegador para ver esta página en tu idioma." },
  { lang: "PT", text: "Use o recurso de tradução do seu navegador para ver esta página no seu idioma." },
  { lang: "ZH", text: "使用浏览器的翻译功能，将此页面翻译成您的语言。" },
  { lang: "RU", text: "Используйте функцию перевода вашего браузера, чтобы просмотреть эту страницу на вашем языке." },
  { lang: "FR", text: "Utilisez la fonction de traduction de votre navigateur pour afficher cette page dans votre langue." },
  { lang: "DE", text: "Verwenden Sie die Übersetzungsfunktion Ihres Browsers, um diese Seite in Ihrer Sprache anzuzeigen." },
  { lang: "JA", text: "ブラウザの翻訳機能を使って、このページをあなたの言語で表示してください。" },
  { lang: "KO", text: "브라우저의 번역 기능을 사용하여 이 페이지를 귀하의 언어로 보세요." },
  { lang: "AR", text: "استخدم ميزة الترجمة في متصفحك لعرض هذه الصفحة بلغتك." },
  { lang: "HI", text: "इस पृष्ठ को अपनी भाषा में देखने के लिए अपने ब्राउज़र की अनुवाद सुविधा का उपयोग करें।" },
  { lang: "IT", text: "Usa la funzione di traduzione del tuo browser per visualizzare questa pagina nella tua lingua." },
];

const TranslateHelper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Globe Button - bottom right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-black/80 transition-all duration-200 group"
        aria-label="Translate this page"
      >
        <Globe className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-20 right-6 z-[10001] w-[360px] max-h-[75vh] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">Translate Page</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  This website is in English. Use your browser's built-in translate feature to view it in your language.
                </p>

                {/* Translated intros */}
                <div className="mb-5 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1.5 max-h-[140px] overflow-y-auto">
                  {translatedIntros.map(({ lang, text }) => (
                    <p key={lang} className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      <span className="font-semibold text-foreground/60 mr-1.5">{lang}</span>
                      {text}
                    </p>
                  ))}
                </div>

                {/* Browser instructions */}
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Chrome className="h-4 w-4 text-foreground/80" />
                      <h4 className="font-medium text-sm text-foreground">Chrome</h4>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Right-click anywhere on the page</li>
                      <li>Select <span className="font-medium text-foreground/80">"Translate to..."</span></li>
                      <li>Choose your language</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-foreground/80" />
                      <h4 className="font-medium text-sm text-foreground">Safari</h4>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Tap the <span className="font-medium text-foreground/80">aA</span> button in the address bar</li>
                      <li>Select <span className="font-medium text-foreground/80">"Translate to..."</span></li>
                      <li>Pick your preferred language</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-foreground/80" />
                      <h4 className="font-medium text-sm text-foreground">Edge</h4>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Click the translate icon in the address bar</li>
                      <li>Or right-click → <span className="font-medium text-foreground/80">"Translate to..."</span></li>
                      <li>Select your language</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-foreground/80" />
                      <h4 className="font-medium text-sm text-foreground">Firefox</h4>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Click the translate icon in the address bar</li>
                      <li>Select your target language</li>
                      <li>Click <span className="font-medium text-foreground/80">"Translate"</span></li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-foreground/80" />
                      <h4 className="font-medium text-sm text-foreground">Mobile (iOS / Android)</h4>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>A translate banner usually appears automatically</li>
                      <li>If not, tap the <span className="font-medium text-foreground/80">⋮ menu</span> → <span className="font-medium text-foreground/80">"Translate"</span></li>
                      <li>On Safari: tap <span className="font-medium text-foreground/80">aA</span> → <span className="font-medium text-foreground/80">"Translate"</span></li>
                    </ol>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
                  Translation is handled by your browser — no data is sent to us.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TranslateHelper;
