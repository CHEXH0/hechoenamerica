
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (value: string) => {
    setFormData(prev => ({ ...prev, country: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simple form validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t.contact.missingInfoTitle,
        description: t.contact.missingInfoDesc,
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData to submit
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("country", formData.country);
      data.append("subject", formData.subject || "New message from HechoEnAmerica website");
      data.append("message", formData.message);
      data.append("_to", "hechoenamerica369@gmail.com"); // Target email

      // Use FormSubmit.co service to send the email without backend
      const response = await fetch("https://formsubmit.co/hechoenamerica369@gmail.com", {
        method: "POST",
        body: data,
        mode: "no-cors" // This avoids CORS issues but means we won't get a detailed response
      });

      // Since we're using no-cors mode, we can't check response status
      // We'll just assume it worked and show a success message
      toast({
        title: t.contact.messageSentTitle,
        description: t.contact.messageSentDesc,
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        country: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: t.contact.errorTitle,
        description: t.contact.errorDesc,
        variant: "destructive"
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950/60 via-gray-900 to-black relative overflow-hidden">
      {/* Purple gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-purple-900/40" />
      
      {/* Floating bubble decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-violet-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-300/10 rounded-full blur-lg animate-pulse" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 drop-shadow-lg">
            {t.contact.title}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name input - Classic bubble with user emojis */}
              <div className="relative bubble-container">
                <div className="absolute top-3 left-8 text-xl opacity-40 blur-sm pointer-events-none z-10">👤</div>
                <div className="absolute top-2 right-12 text-lg opacity-35 blur-sm pointer-events-none z-10">✨</div>
                <div className="absolute top-8 left-16 text-sm opacity-30 blur-sm pointer-events-none z-10">🌟</div>
                <div className="absolute bottom-4 right-6 text-md opacity-25 blur-sm pointer-events-none z-10">👋</div>
                <div className="absolute bottom-2 left-4 text-sm opacity-20 blur-sm pointer-events-none z-10">🎯</div>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.contact.namePlaceholder}
                  className="bubble-input bg-black backdrop-blur-md border border-purple-400/30 text-white placeholder:text-gray-400 rounded-full px-8 py-6 h-16 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.02] focus:text-white"
                  required
                />
              </div>

              {/* Email input - Elongated bubble with email emojis */}
              <div className="relative bubble-container">
                <div className="absolute top-2 left-4 text-lg opacity-35 blur-sm pointer-events-none z-10">📧</div>
                <div className="absolute top-6 right-6 text-md opacity-30 blur-sm pointer-events-none z-10">💌</div>
                <div className="absolute bottom-4 left-10 text-sm opacity-25 blur-sm pointer-events-none z-10">📮</div>
                <div className="absolute top-4 left-20 text-sm opacity-20 blur-sm pointer-events-none z-10">✉️</div>
                <div className="absolute bottom-2 right-16 text-xs opacity-15 blur-sm pointer-events-none z-10">📬</div>
                <div className="absolute top-8 right-12 text-xs opacity-20 blur-sm pointer-events-none z-10">📨</div>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.contact.emailPlaceholder}
                  className="bubble-input bg-black backdrop-blur-md border border-violet-400/40 text-white placeholder:text-gray-400 rounded-full px-8 py-6 h-16 shadow-[0_6px_28px_rgba(139,69,195,0.4),inset_0_2px_0_rgba(255,255,255,0.15),inset_0_-2px_0_rgba(0,0,0,0.2)] focus:shadow-[0_10px_36px_rgba(139,69,195,0.5),inset_0_2px_0_rgba(255,255,255,0.25)] focus:border-violet-300/60 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(139,69,195,0.45)] hover:scale-[1.01] focus:text-white"
                  required
                />
              </div>
            </div>

            {/* Country selection - Globe bubble with country emojis */}
            <div className="relative bubble-container">
              <div className="absolute top-3 left-8 text-lg opacity-35 blur-sm pointer-events-none z-10">🌍</div>
              <div className="absolute top-6 right-12 text-md opacity-30 blur-sm pointer-events-none z-10">🗺️</div>
              <div className="absolute bottom-4 left-16 text-sm opacity-25 blur-sm pointer-events-none z-10">🌎</div>
              <div className="absolute top-2 right-6 text-sm opacity-20 blur-sm pointer-events-none z-10">🏴</div>
              <div className="absolute bottom-2 right-20 text-xs opacity-15 blur-sm pointer-events-none z-10">🌏</div>
              <Select value={formData.country} onValueChange={handleCountryChange}>
                <SelectTrigger className="bubble-input bg-black backdrop-blur-md border border-purple-400/30 text-white rounded-full px-8 py-6 h-16 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.02] [&>span]:text-white [&>span]:text-left">
                  <SelectValue placeholder={t.contact.countryPlaceholder} className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-purple-400/30 max-h-60 z-50">
                  <SelectItem value="us" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇺🇸 United States</SelectItem>
                  <SelectItem value="ca" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇨🇦 Canada</SelectItem>
                  <SelectItem value="mx" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇲🇽 Mexico</SelectItem>
                  <SelectItem value="br" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇧🇷 Brazil</SelectItem>
                  <SelectItem value="ar" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇦🇷 Argentina</SelectItem>
                  <SelectItem value="co" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇨🇴 Colombia</SelectItem>
                  <SelectItem value="ve" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇻🇪 Venezuela</SelectItem>
                  <SelectItem value="pe" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇵🇪 Peru</SelectItem>
                  <SelectItem value="cl" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇨🇱 Chile</SelectItem>
                  <SelectItem value="ec" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇪🇨 Ecuador</SelectItem>
                  <SelectItem value="cu" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇨🇺 Cuba</SelectItem>
                  <SelectItem value="do" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇩🇴 Dominican Republic</SelectItem>
                  <SelectItem value="pr" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇵🇷 Puerto Rico</SelectItem>
                  <SelectItem value="cr" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇨🇷 Costa Rica</SelectItem>
                  <SelectItem value="pa" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇵🇦 Panama</SelectItem>
                  <SelectItem value="gt" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇬🇹 Guatemala</SelectItem>
                  <SelectItem value="hn" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇭🇳 Honduras</SelectItem>
                  <SelectItem value="ni" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇳🇮 Nicaragua</SelectItem>
                  <SelectItem value="sv" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇸🇻 El Salvador</SelectItem>
                  <SelectItem value="bo" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇧🇴 Bolivia</SelectItem>
                  <SelectItem value="py" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇵🇾 Paraguay</SelectItem>
                  <SelectItem value="uy" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇺🇾 Uruguay</SelectItem>
                  <SelectItem value="es" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🇪🇸 Spain</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-purple-400/20 focus:bg-purple-400/20">🌍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject input - Soap bubble effect with topic emojis */}
            <div className="relative bubble-container">
              <div className="absolute top-3 left-12 text-lg opacity-35 blur-sm pointer-events-none z-10">💭</div>
              <div className="absolute top-7 right-16 text-md opacity-30 blur-sm pointer-events-none z-10">🎯</div>
              <div className="absolute bottom-5 left-20 text-sm opacity-25 blur-sm pointer-events-none z-10">📝</div>
              <div className="absolute top-2 left-6 text-sm opacity-20 blur-sm pointer-events-none z-10">💡</div>
              <div className="absolute bottom-3 right-8 text-xs opacity-15 blur-sm pointer-events-none z-10">🔖</div>
              <div className="absolute top-6 right-6 text-xs opacity-25 blur-sm pointer-events-none z-10">📋</div>
              <div className="absolute bottom-7 left-32 text-xs opacity-20 blur-sm pointer-events-none z-10">🎨</div>
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={t.contact.subjectPlaceholder}
                className="bubble-input bg-black backdrop-blur-lg border-2 border-transparent bg-clip-padding shadow-[0_0_0_1px_rgba(168,85,247,0.4)] text-white placeholder:text-gray-400 rounded-full px-8 py-6 h-16 shadow-[0_10px_35px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(168,85,247,0.1)] focus:shadow-[0_15px_45px_rgba(168,85,247,0.4),inset_0_2px_0_rgba(255,255,255,0.3)] focus:bg-clip-padding transition-all duration-500 hover:shadow-[0_12px_40px_rgba(168,85,247,0.35)] hover:scale-[1.015] focus:text-white"
              />
            </div>

            {/* Message textarea - Large bubble with communication emojis */}
            <div className="relative bubble-container">
              <div className="absolute top-6 left-10 text-xl opacity-35 blur-sm pointer-events-none z-10">💬</div>
              <div className="absolute top-12 right-12 text-lg opacity-30 blur-sm pointer-events-none z-10">🗨️</div>
              <div className="absolute top-20 left-16 text-md opacity-25 blur-sm pointer-events-none z-10">💡</div>
              <div className="absolute bottom-12 right-20 text-sm opacity-20 blur-sm pointer-events-none z-10">📄</div>
              <div className="absolute bottom-6 left-24 text-sm opacity-25 blur-sm pointer-events-none z-10">✍️</div>
              <div className="absolute top-16 right-6 text-sm opacity-15 blur-sm pointer-events-none z-10">📃</div>
              <div className="absolute bottom-16 left-8 text-xs opacity-20 blur-sm pointer-events-none z-10">🖊️</div>
              <div className="absolute top-24 left-28 text-xs opacity-15 blur-sm pointer-events-none z-10">📊</div>
              <div className="absolute bottom-20 right-16 text-xs opacity-25 blur-sm pointer-events-none z-10">🎵</div>
              <div className="absolute top-8 right-24 text-xs opacity-20 blur-sm pointer-events-none z-10">🎤</div>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t.contact.messagePlaceholder}
                className="bubble-input bg-black backdrop-blur-md border border-indigo-400/35 text-white placeholder:text-gray-400 rounded-3xl px-8 py-6 min-h-40 shadow-[0_12px_40px_rgba(99,102,241,0.35),inset_0_2px_0_rgba(255,255,255,0.2),inset_0_-2px_0_rgba(0,0,0,0.15)] focus:shadow-[0_16px_50px_rgba(99,102,241,0.45),inset_0_3px_0_rgba(255,255,255,0.25)] focus:border-indigo-300/50 transition-all duration-500 resize-none hover:shadow-[0_14px_45px_rgba(99,102,241,0.4)] hover:scale-[1.005] focus:text-white"
                rows={6}
                required
              />
            </div>

            {/* Submit button - Clean design without emojis */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-br from-purple-600/90 via-purple-500/80 to-violet-600/90 hover:from-purple-500 hover:via-purple-400 hover:to-violet-500 text-white rounded-full h-16 shadow-[0_12px_40px_rgba(147,51,234,0.5),inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.25),inset_0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_16px_50px_rgba(147,51,234,0.6)] transition-all duration-500 font-semibold text-lg backdrop-blur-sm border border-purple-300/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t.contact.sendingButton : t.contact.sendButton}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
