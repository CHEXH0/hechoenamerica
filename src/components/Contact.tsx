
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
              <div className="relative">
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                  className="bg-purple-100/10 backdrop-blur-sm border-purple-300/30 text-white placeholder:text-purple-200/70 rounded-2xl px-6 py-4 h-14 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20 focus:border-purple-400/50 transition-all duration-300"
                  required
                />
              </div>
              <div className="relative">
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="bg-purple-100/10 backdrop-blur-sm border-purple-300/30 text-white placeholder:text-purple-200/70 rounded-2xl px-6 py-4 h-14 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20 focus:border-purple-400/50 transition-all duration-300"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                className="bg-purple-100/10 backdrop-blur-sm border-purple-300/30 text-white placeholder:text-purple-200/70 rounded-2xl px-6 py-4 h-14 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20 focus:border-purple-400/50 transition-all duration-300"
              />
            </div>
            <div className="relative">
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Message"
                className="bg-purple-100/10 backdrop-blur-sm border-purple-300/30 text-white placeholder:text-purple-200/70 rounded-2xl px-6 py-4 min-h-32 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20 focus:border-purple-400/50 transition-all duration-300 resize-none"
                rows={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-2xl h-14 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 font-semibold"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
