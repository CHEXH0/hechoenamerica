import { useState } from "react";
import { Globe, X, Chrome, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TranslateHelper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Globe Button - always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[9999] p-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-accent/80 transition-all duration-200 group"
        aria-label="Translate this page"
      >
        <Globe className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
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
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 right-4 z-[10001] w-[340px] max-h-[80vh] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl"
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

                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  This website is in English. Use your browser's built-in translate feature to view it in your language.
                </p>

                {/* Chrome */}
                <div className="space-y-4">
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

                  {/* Safari */}
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

                  {/* Edge */}
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

                  {/* Firefox */}
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

                  {/* Mobile */}
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
