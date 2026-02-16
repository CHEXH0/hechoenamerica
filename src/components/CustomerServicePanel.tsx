import React, { useState } from "react";
import { Headphones, Send, Phone, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CustomerServicePanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Pre-fill email when user is logged in
  React.useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name, email, subject: `Support: ${subject}`, message },
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      console.error("Error sending support email:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Customer Support"
        >
          <Headphones className="h-5 w-5 text-gray-300 hover:text-white transition-colors" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-black/95 backdrop-blur-xl border-l border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-white flex items-center gap-2 text-xl">
            <Headphones className="h-5 w-5 text-purple-400" />
            Customer Support
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Have a question or need help? Send us a message and we'll respond shortly.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label htmlFor="cs-name" className="text-gray-300">Name</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cs-email" className="text-gray-300">Email</Label>
            <Input
              id="cs-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cs-subject" className="text-gray-300">Subject</Label>
            <Input
              id="cs-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cs-message" className="text-gray-300">Message</Label>
            <Textarea
              id="cs-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
              rows={5}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={sending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Message
          </Button>
        </form>

        <Separator className="my-6 bg-white/10" />

        {/* Urgent Contact */}
        <div className="space-y-4 pb-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Need urgent help?
          </h3>

          <a
            href="mailto:team@hechoenamericastudio.com"
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                Email Us Directly
              </p>
              <p className="text-xs text-gray-500">
                team@hechoenamericastudio.com
              </p>
            </div>
          </a>

          <a
            href="tel:+13059992835"
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-pink-300 transition-colors">
                Call Us
              </p>
              <p className="text-xs text-gray-500">
                +1 (305) 999-2835
              </p>
            </div>
          </a>

          <p className="text-xs text-gray-600 text-center">
            Available Mon–Fri, 10 AM – 6 PM EST
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomerServicePanel;
