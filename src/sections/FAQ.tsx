import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedSection } from '@/components/AnimatedSection';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';
import { ChevronDown } from 'lucide-react';

interface FAQItemData {
  question: string;
  answer: string;
}

interface FAQContent {
  badge: string;
  title: string;
  subtitle: string;
  items: FAQItemData[];
}

const defaults = siteDefaults.faqs as unknown as FAQContent;

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  questionColor,
  answerColor,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  questionColor?: string;
  answerColor?: string;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-opti-text-primary pr-4 group-hover:text-opti-accent transition-colors" style={{ color: questionColor || undefined }}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-opti-text-secondary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-opti-text-secondary leading-relaxed pr-8" style={{ color: answerColor || undefined }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { getContent } = useSiteContentData();
  const content = getContent<FAQContent>('faqs') ?? defaults;
  const items = content.items ?? defaults.items;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('questions') ? (
                <>Frequently asked{' '}<span className="text-gradient">questions</span></>
              ) : (
                content.title
              )}
            </>
          }
          subtitle={content.subtitle}
          className="text-center mb-12"
          titleColor={tc.title}
          subtitleColor={tc.subtitle}
        />

        {/* FAQ List */}
        <AnimatedSection delay={0.3}>
          <div className="glass-card p-6">
            {items.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                questionColor={tc.question}
                answerColor={tc.answer}
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
