'use client';

import { motion } from 'motion/react';
import { fadeInUp, scaleIn, staggerContainer } from '@/lib/motion';

const STEPS = [
  {
    number: '01',
    title: 'Describe',
    description:
      'Enter your topic, target audience, preferred tone, and slide count.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 0 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Generate',
    description:
      'AI creates structured slides with bullet points, speaker notes, and visual themes.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Export',
    description:
      'Review and edit your slides, then download a polished PowerPoint deck.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works-section" className="px-6 py-20 sm:py-28">
      <motion.div
        className="max-w-5xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        {/* Section header */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold font-(family-name:--font-sora) mb-4">
            How it{' '}
            <span className="gradient-text">works</span>
          </h3>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Three simple steps. No design skills required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[2px] step-connector rounded-full"
            aria-hidden="true"
          />

          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={scaleIn}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step circle */}
              <div className="relative z-10 w-16 h-16 rounded-2xl gradient-button flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-6">
                {step.icon}
              </div>

              {/* Step number */}
              <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                Step {step.number}
              </span>

              <h4 className="text-xl font-bold font-(family-name:--font-sora) text-foreground mb-2">
                {step.title}
              </h4>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
