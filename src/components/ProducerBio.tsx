import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/TranslationContext";

interface ProducerBioProps {
  bio: string;
}

const ProducerBio = ({ bio }: ProducerBioProps) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl"
    >
      <h2 className="text-3xl font-bold mb-4 text-white">{t.producer.about}</h2>
      <p className="text-white/90 leading-relaxed text-lg">{bio}</p>
    </motion.div>
  );
};

export default ProducerBio;
