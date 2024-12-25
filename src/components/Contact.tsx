import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Get in Touch
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  type="text"
                  placeholder="Name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Subject"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Textarea
                placeholder="Message"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                rows={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-studio-red hover:bg-studio-red/90 text-white"
            >
              Send Message
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;