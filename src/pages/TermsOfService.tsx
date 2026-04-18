import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

// Renders inline **bold** markers as <strong>
const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const TermsOfService = () => {
  const { t } = useTranslation();
  const tt = t.termsOfService;
  const s = tt.sections;

  const renderList = (items: string[]) => (
    <ul className="list-disc list-inside space-y-2 ml-4">
      {items.map((item, idx) => (
        <li key={idx}>{renderInline(item)}</li>
      ))}
    </ul>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl overflow-hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tt.backToHome}
        </Link>

        <h1 className="text-4xl font-bold heading-gradient mb-8">{tt.title}</h1>
        <p className="text-gray-400 mb-8">{tt.lastUpdated}</p>

        <div className="space-y-8 text-gray-300">
          <Section title={s.acceptance.title}>
            <p>{s.acceptance.body}</p>
          </Section>

          <Section title={s.services.title}>
            <p className="mb-4">{s.services.intro}</p>
            {renderList(s.services.items)}
          </Section>

          <Section title={s.accounts.title}>
            <p className="mb-4">{s.accounts.intro}</p>
            {renderList(s.accounts.items)}
            <p className="mt-4">{s.accounts.footer}</p>
          </Section>

          <Section title={s.customSongs.title}>
            <p className="mb-4">{s.customSongs.intro}</p>
            {renderList(s.customSongs.items)}
          </Section>

          <Section title={s.chamoy.title}>
            <p className="mb-4">{s.chamoy.intro}</p>
            {renderList(s.chamoy.items)}
          </Section>

          <Section title={s.cancellations.title}>{renderList(s.cancellations.items)}</Section>

          <Section title={s.payments.title}>{renderList(s.payments.items)}</Section>

          <Section title={s.aiSongs.title}>
            <p>{s.aiSongs.body}</p>
          </Section>

          <Section title={s.ip.title}>
            <p>{s.ip.body}</p>
          </Section>

          <Section title={s.delivery.title}>
            <p>{s.delivery.body}</p>
          </Section>

          <Section title={s.producerApps.title}>
            <p>{s.producerApps.body}</p>
          </Section>

          <Section title={s.prohibited.title}>{renderList(s.prohibited.items)}</Section>

          <Section title={s.liability.title}>
            <p>{s.liability.body}</p>
          </Section>

          <Section title={s.changes.title}>
            <p>{s.changes.body}</p>
          </Section>

          <Section title={s.contact.title}>
            <p>{s.contact.body}</p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
