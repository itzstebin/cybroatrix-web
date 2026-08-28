import { motion, useReducedMotion } from 'framer-motion';
import { Target, Eye, Heart, Lightbulb, Users, Code2, GraduationCap, Trophy, Package } from 'lucide-react';

function Shield2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const values = [
  { icon: Shield2, title: 'Integrity', desc: 'We operate with transparency and honesty. We\'re learners too — we don\'t pretend to be experts we\'re not.' },
  { icon: Users, title: 'Community First', desc: 'We\'re building this together. Everyone who joins early helps shape what CybroatriX becomes.' },
  { icon: Lightbulb, title: 'Learning Together', desc: 'We\'re not experts claiming to teach. We\'re learners sharing the journey. We grow as a group.' },
  { icon: Heart, title: 'Friendly & Open', desc: 'No gatekeeping, no ego. A welcoming space for beginners, students, and anyone curious about tech and security.' },
];

const whatWeDo = [
  { icon: GraduationCap, title: 'Learn', desc: 'We explore tech & security together. Shared resources, discussions, and learning sessions.' },
  { icon: Code2, title: 'Build', desc: 'Hands-on projects, coding sessions, and collaborative development as a community.' },
  { icon: Trophy, title: 'Events', desc: 'CTFs, workshops, hackathons, and live sessions planned for the future.' },
  { icon: Package, title: 'Products', desc: 'Down the road — tools, apps, and open-source projects built by the community.' },
];

function getRoadmap() {
  const launchDate = new Date('2026-07-07');
  const now = new Date();
  const isLaunched = now >= launchDate;

  return [
    { status: 'done', title: 'Founded by a Student', date: 'Founded', desc: 'A student with a passion for tech and security started CybroatriX — setting up Discord and planning the vision.' },
    { status: 'done', title: 'Team Formation', date: 'Built', desc: 'A dedicated team came together to build the platform from the ground up.' },
    {
      status: isLaunched ? 'done' : 'now',
      title: 'Official Launch',
      date: isLaunched ? 'Launched 7/7/2026' : 'Coming Soon',
      desc: isLaunched ? 'CybroatriX officially launched on July 7, 2026.' : 'Preparing for the official launch.',
    },
    { status: 'soon', title: 'What\'s Next', date: 'Coming Soon', desc: 'New features, events, and community programs are on the way.' },
  ];
}

export default function About() {
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
          <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 sm:mb-4">WHO WE ARE</p>
          <h1 className="font-cyber text-3xl sm:text-4xl md:text-5xl text-white mb-5 sm:mb-6">
            <span className="gradient-text">DIGITAL MATRIX</span>
          </h1>
          <div className="divider-gradient w-20 sm:w-24 mx-auto opacity-50 mb-6 sm:mb-8" />
          <p className="text-white/50 font-inter text-base sm:text-lg leading-relaxed mb-4">
            <span className="text-white">CybroatriX</span> means <span className="gradient-text">Digital Matrix</span> — a connected network for learning, building, coding, and growing together.
          </p>
          <p className="text-white/40 font-inter text-sm leading-relaxed">
            We're a friendly tech & cybersecurity community. We're learners too — not experts pretending to have all the answers. We build, we code, we run events, and eventually we'll build products. Everyone is welcome.
          </p>
        </motion.div>
      </section>

      {/* What we do */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <div className="max-w-5xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-10 sm:mb-12">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">WHAT WE DO</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">
              LEARN • BUILD • CODE • <span className="gradient-text">GROW</span>
            </h2>
            <div className="divider-gradient w-24 mx-auto opacity-50" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {whatWeDo.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className="feature-card p-5 sm:p-6 rounded-sm text-center"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-bg flex items-center justify-center mx-auto mb-3 sm:mb-4 rounded-sm">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-cyber text-base sm:text-lg text-white mb-2 tracking-wide">{title}</h3>
                <p className="text-white/40 text-xs sm:text-sm font-inter leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-4 sm:py-8 px-4 sm:px-6 pb-12 sm:pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="feature-card p-6 sm:p-8 rounded-sm">
            <div className="w-11 h-11 sm:w-12 sm:h-12 gradient-bg flex items-center justify-center mb-5 sm:mb-6 rounded-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-cyber text-lg sm:text-xl text-white mb-3 sm:mb-4 tracking-wide">OUR MISSION</h2>
            <p className="text-white/50 font-inter leading-relaxed text-sm">
              To create a friendly, welcoming tech community where everyone can learn, build, and grow together — no gatekeeping, no judgment. We're learners too, sharing the journey.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="feature-card p-6 sm:p-8 rounded-sm">
            <div className="w-11 h-11 sm:w-12 sm:h-12 gradient-bg flex items-center justify-center mb-5 sm:mb-6 rounded-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-cyber text-lg sm:text-xl text-white mb-3 sm:mb-4 tracking-wide">OUR VISION</h2>
            <p className="text-white/50 font-inter leading-relaxed text-sm">
              A global Digital Matrix — a connected network of learners and builders. From learning and coding to events and eventual products, we grow together into something meaningful.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Roadmap */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-10 sm:mb-12">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">OUR JOURNEY</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">
              <span className="gradient-text">ROADMAP</span> TO JOURNEY
            </h2>
            <div className="divider-gradient w-24 mx-auto opacity-50" />
          </motion.div>

          <div className="relative">
            {/* Vertical line — a real sequence, so a stepped reveal down the line reinforces the timeline rather than just decorating it */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/50 via-blue-600/30 to-transparent" />
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.15 } } }}
              className="space-y-5 sm:space-y-6 pl-12 sm:pl-16"
            >
              {getRoadmap().map((item) => (
                <motion.div
                  key={item.title}
                  variants={reduceMotion ? { hidden: { opacity: 1 }, show: { opacity: 1 } } : { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className={`absolute -left-8 sm:-left-10 top-4 w-3 h-3 rounded-full border-2 border-[#070709] ${
                    item.status === 'done' ? 'bg-green-500' :
                    item.status === 'now' ? 'bg-blue-500 animate-pulse dot-pulse' :
                    item.status === 'soon' ? 'gradient-bg' :
                    'bg-white/20'
                  }`} />
                  <div className={`feature-card p-4 sm:p-5 rounded-sm ${item.status === 'now' ? 'border border-blue-500/30' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <span className={`font-cyber text-sm sm:text-base ${
                        item.status === 'done' ? 'text-green-400' :
                        item.status === 'now' ? 'gradient-text' :
                        item.status === 'soon' ? 'text-blue-400' :
                        'text-white/50'
                      }`}>
                        {item.date}
                      </span>
                      {item.status === 'now' && (
                        <span className="gradient-bg font-cyber text-xs px-2 py-0.5 text-white tracking-wider">NOW</span>
                      )}
                    </div>
                    <h3 className={`font-cyber text-sm sm:text-base mb-1 ${
                      item.status === 'future' ? 'text-white/60' : 'text-white'
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-sm font-inter leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <div className="max-w-6xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-10 sm:mb-16">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">WHAT DRIVES US</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">
              CORE <span className="gradient-text">VALUES</span>
            </h2>
            <div className="divider-gradient w-24 mx-auto opacity-50" />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {values.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className="feature-card p-5 sm:p-6 rounded-sm text-center"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-bg flex items-center justify-center mx-auto mb-3 sm:mb-4 rounded-sm">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-cyber text-sm sm:text-base text-white mb-2 sm:mb-3">{title}</h3>
                <p className="text-white/40 text-xs sm:text-sm font-inter leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
