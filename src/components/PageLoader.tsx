import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const PageLoader = ({ message = "Loading..." }: { message?: string }) => {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(40), 300);
    const t2 = setTimeout(() => setProgress(65), 800);
    const t3 = setTimeout(() => setProgress(80), 1500);
    const t4 = setTimeout(() => setProgress(90), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xs space-y-3 px-4"
      >
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      </motion.div>
    </div>
  );
};

export default PageLoader;
