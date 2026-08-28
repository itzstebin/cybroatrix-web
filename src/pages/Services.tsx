import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Code2, BookOpen, Terminal, Search, Lock, ArrowRight } from 'lucide-react';

const plannedServices = [
  {
    icon: Shield,
    title: 'Threat Intelligence',
    category: 'DEFENSE',
    desc: 'Real-time threat feeds, IOC sharing, and collective defense knowledge shared across the community.',
  },
  {
    icon: Terminal,
    title: 'Penetration Testing',
    category: 'OFFENSIVE',
    desc: 'Guides, labs, and methodologies for ethical hacking — built and curated by the community.',
  },
  {
    icon: BookOpen,
    title: 'Education & Training',
    category: 'LEARNING',
    desc: 'Structured learning paths from beginner to advanced, covering all major cybersecurity domains.',
  },
  {
    icon: Code2,
    title: 'Security Tooling',
    category: 'TOOLS',
    desc: 'Open-source community tools, scripts, and automations — free to use and contribute to.',
  },
  {
    icon: Search,
    title: 'OSINT Framework',
    category: 'INTELLIGENCE',
    desc: 'Structured OSINT methodology, tooling guides, and investigation templates for practitioners.',
  },
  {
    icon: Lock,
    title: 'Secure Development',
    category: 'DEVSECOPS',
    desc: 'Secure coding practices, vulnerability patterns, and DevSecOps resources for developers.',
  },
];

const contributeSteps = [
  { step: '01', title: 'Join the Discord', desc: 'Be part of the early community and help define the direction of CybroatriX.' },
  { step: '02', title: 'Share Your Expertise', desc: 'Got knowledge to share? Contribute tools, writeups, or guides as we build the resource library.' },
  { step: '03', title: 'Spread the Word', desc: 'Know someone who belongs here? Bring them in. Growth starts with the community.' },
];

export default function Services() {
  const reduceMotion = useReducedMotion();

  const sectionReveal = reduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 }, viewport: { once: true } }
    : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

  const fadeUp = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl mx-auto"
        >
          <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 sm:mb-4">WHAT'S COMING</p>
          <h1 className="font-cyber text-3xl sm:text-4xl md:text-5xl text-white mb-5 sm:mb-6">
            OUR <span className="gradient-text">SERVICES</span>
          </h1>
          <div className="divider-gradient w-20 sm:w-24 mx-auto opacity-50 mb-6 sm:mb-8" />

          {/* Coming Soon badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 border border-blue-600/30 bg-blue-950/15 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <span className="font-cyber text-xs text-blue-400 tracking-widest">ALL SERVICES — COMING SOON</span>
          </div>

          <p className="text-white/50 font-inter text-base sm:text-lg leading-relaxed">
            We're actively building these services. Below is what we're planning to offer — nothing is live yet, but this is where we're headed.
          </p>
        </motion.div>
      </section>

      {/* Planned Services Grid */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {plannedServices.map(({ icon: Icon, title, category, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className="feature-card p-5 sm:p-7 rounded-sm relative overflow-hidden"
              >
                {/* Coming Soon tag */}
                <div className="absolute top-4 right-4">
                  <span className="font-cyber text-xs text-white/25 border border-white/10 px-2 py-0.5 tracking-widest">
                    SOON
                  </span>
                </div>

                <div className="flex items-start gap-2 mb-4 sm:mb-5">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 gradient-bg flex items-center justify-center rounded-sm flex-shrink-0 opacity-60">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="font-cyber text-xs text-blue-500/50 tracking-widest border border-blue-600/15 px-2 py-0.5 mb-3 inline-block">
                  {category}
                </span>
                <h3 className="font-cyber text-sm sm:text-base text-white/80 mb-2 sm:mb-3 tracking-wide">{title}</h3>
                <p className="text-white/35 text-sm font-inter leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* In the meantime */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-blue-900/20">
        <motion.div {...sectionReveal} className="max-w-4xl mx-auto text-center">
          <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 sm:mb-4">IN THE MEANTIME</p>
          <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4 sm:mb-6">
            CONNECT WITH US <span className="gradient-text">NOW</span>
          </h2>
          <p className="text-white/40 font-inter text-sm max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
            While we build out the full platform, the best place to connect, learn, and be part of the early community is our Discord. Come introduce yourself.
          </p>
          <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://discord.gg/heDDrcJJ2N"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-xs w-full xs:w-auto justify-center"
            >
              JOIN DISCORD <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/CybroatriX"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-xs w-full xs:w-auto text-center"
            >
              GITHUB
            </a>
          </div>
        </motion.div>
      </section>

      {/* How to contribute */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-10 sm:mb-12">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">EARLY MEMBERS</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">
              HELP US <span className="gradient-text">BUILD IT</span>
            </h2>
            <div className="divider-gradient w-24 mx-auto opacity-50" />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.15 } } }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8"
          >
            {contributeSteps.map((s) => (
              <motion.div key={s.step} variants={fadeUp} transition={{ duration: 0.5 }} className="text-center">
                <div className="font-cyber text-4xl sm:text-5xl font-bold gradient-text opacity-25 mb-3 sm:mb-4">{s.step}</div>
                <h3 className="font-cyber text-sm sm:text-base text-white mb-2 sm:mb-3 tracking-wide">{s.title}</h3>
                <p className="text-white/40 text-sm font-inter leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
