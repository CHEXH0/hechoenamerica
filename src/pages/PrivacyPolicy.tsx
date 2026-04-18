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

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const tp = t.privacyPolicy;
  const s = tp.sections;

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
          {tp.backToHome}
        </Link>

        <h1 className="text-4xl font-bold heading-gradient mb-8">{tp.title}</h1>
        <p className="text-gray-400 mb-8">{tp.lastUpdated}</p>

        <div className="space-y-8 text-gray-300">
          <Section title={s.introduction.title}>
            <p>{s.introduction.body}</p>
          </Section>

          <Section title={s.whatWeCollect.title}>{renderList(s.whatWeCollect.items)}</Section>

          <Section title={s.howWeUse.title}>{renderList(s.howWeUse.items)}</Section>

          <Section title={s.thirdParty.title}>
            {renderList(s.thirdParty.items)}
            <p className="mt-4">{s.thirdParty.footer}</p>
          </Section>

          <Section title={s.accountSecurity.title}>
            <p>{s.accountSecurity.body}</p>
          </Section>

          <Section title={s.dataSecurity.title}>
            <p>{s.dataSecurity.body}</p>
          </Section>

          <Section title={s.translation.title}>
            <p>{s.translation.body}</p>
          </Section>

          <Section title={s.yourRights.title}>{renderList(s.yourRights.items)}</Section>

          <Section title={s.accountDeletion.title}>
            <p>{s.accountDeletion.body}</p>
          </Section>

          <Section title={s.contact.title}>
            <p>{s.contact.body}</p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
