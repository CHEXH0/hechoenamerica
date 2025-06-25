
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simple form validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
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
        title: "Message sent",
        description: "Thank you for your message. We'll get back to you soon!",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-950 via-purple-900 to-black relative overflow-hidden">
      {/* Purple gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-violet-800/20" />
      
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
            Get in Touch
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative bubble-container">
                {/* Bubble reflection highlight */}
                <div className="absolute top-2 left-6 w-8 h-4 bg-white/30 rounded-full blur-sm pointer-events-none z-10" />
                {/* Secondary highlight */}
                <div className="absolute top-3 right-8 w-3 h-3 bg-white/20 rounded-full blur-sm pointer-events-none z-10" />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                  className="bubble-input bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-md border border-purple-400/30 text-white placeholder:text-gray-300 rounded-full px-8 py-6 h-16 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.02] focus:text-white"
                  required
                />
              </div>
              <div className="relative bubble-container">
                {/* Bubble reflection highlight */}
                <div className="absolute top-2 left-6 w-8 h-4 bg-white/30 rounded-full blur-sm pointer-events-none z-10" />
                {/* Secondary highlight */}
                <div className="absolute top-3 right-8 w-3 h-3 bg-white/20 rounded-full blur-sm pointer-events-none z-10" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="bubble-input bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-md border border-purple-400/30 text-white placeholder:text-gray-300 rounded-full px-8 py-6 h-16 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.02] focus:text-white"
                  required
                />
              </div>
            </div>
            <div className="relative bubble-container">
              {/* Bubble reflection highlight */}
              <div className="absolute top-2 left-6 w-8 h-4 bg-white/30 rounded-full blur-sm pointer-events-none z-10" />
              {/* Secondary highlight */}
              <div className="absolute top-3 right-8 w-3 h-3 bg-white/20 rounded-full blur-sm pointer-events-none z-10" />
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                className="bubble-input bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-md border border-purple-400/30 text-white placeholder:text-gray-300 rounded-full px-8 py-6 h-16 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.02] focus:text-white"
              />
            </div>
            <div className="relative bubble-container">
              {/* Bubble reflection highlight - larger for textarea */}
              <div className="absolute top-4 left-6 w-12 h-6 bg-white/30 rounded-full blur-sm pointer-events-none z-10" />
              {/* Secondary highlight */}
              <div className="absolute top-6 right-8 w-4 h-4 bg-white/20 rounded-full blur-sm pointer-events-none z-10" />
              {/* Tertiary small highlight */}
              <div className="absolute top-12 left-12 w-2 h-2 bg-white/25 rounded-full blur-sm pointer-events-none z-10" />
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Message"
                className="bubble-input bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-md border border-purple-400/30 text-white placeholder:text-gray-300 rounded-3xl px-8 py-6 min-h-40 shadow-[0_8px_32px_rgba(147,51,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] focus:shadow-[0_12px_40px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] focus:border-purple-300/50 transition-all duration-500 resize-none hover:shadow-[0_10px_36px_rgba(147,51,234,0.35)] hover:scale-[1.01] focus:text-white"
                rows={6}
                required
              />
            </div>
            <div className="relative bubble-container">
              {/* Button bubble reflection */}
              <div className="absolute top-3 left-8 w-16 h-6 bg-white/30 rounded-full blur-sm pointer-events-none z-10" />
              <div className="absolute top-4 right-12 w-4 h-4 bg-white/20 rounded-full blur-sm pointer-events-none z-10" />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-br from-purple-600/80 via-purple-500/70 to-violet-600/80 hover:from-purple-500 hover:via-purple-400 hover:to-violet-500 text-white rounded-full h-16 shadow-[0_8px_32px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(147,51,234,0.5)] transition-all duration-500 font-semibold text-lg backdrop-blur-sm border border-purple-400/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
