import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedSection } from '@/components/AnimatedSection';
import { SectionHeader } from '@/components/SectionHeader';
import { faqs } from '@/constants/faqs';
import { ChevronDown } from 'lucide-react';

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-display font-medium text-opti-text-primary pr-4 group-hover:text-opti-accent transition-colors">
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
            <p className="pb-5 text-opti-text-secondary leading-relaxed pr-8">
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

  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="FAQ"
          title={
            <>
              Frequently asked{' '}
              <span className="text-gradient">questions</span>
            </>
          }
          subtitle="Everything you need to know about OptiPlan."
          className="text-center mb-12"
        />

        {/* FAQ List */}
        <AnimatedSection delay={0.3}>
          <div className="glass-card p-6">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
