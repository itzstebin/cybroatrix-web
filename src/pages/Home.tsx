import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shield, Cpu, Globe, Zap, Users, Code2, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

const features = [
  { icon: Shield, title: 'Cyber Defense', desc: 'Threat intelligence, defensive strategies, and blue team resources for every skill level.' },
  { icon: Code2, title: 'Ethical Hacking', desc: 'Tools, guides, and labs for learning offensive security in a structured, legal environment.' },
  { icon: Users, title: 'Expert Network', desc: 'A growing network of cybersecurity professionals, learners, and enthusiasts worldwide.' },
  { icon: Cpu, title: 'AI & Automation', desc: 'Exploring the intersection of AI and security — the frontier of next-gen defense.' },
  { icon: Globe, title: 'Global Community', desc: 'Borderless and open — we welcome anyone passionate about tech and security, from anywhere.' },
  { icon: Zap, title: 'Live Events', desc: 'CTF competitions, workshops, and live sessions — compete, learn, and climb the leaderboard.' },
];

const arenaCards = [
  { icon: Shield, label: 'CTF Competitions', desc: 'Solve challenges, earn points, climb the ranks.' },
  { icon: Code2, label: 'Workshops', desc: 'Hands-on learning with community experts.' },
  { icon: Zap, label: 'Live Sessions', desc: 'Real-time talks and interactive demos.' },
];

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { user, profile, signOut } = useAuth();
  const reduceMotion = useReducedMotion();

  const goToEvents = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('events');
  };

  const fadeUp = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 cyber-grid overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(0,102,255,0.07) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-10 text-center w-full max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-5 sm:mb-6 float-anim"
          >
            <img src="/images/ChatGPT_Image_Jul_4,_2026,_07_28_48_PM.png" alt="CybroatriX Logo" className="w-[200px] xs:w-[260px] sm:w-[340px] md:w-[420px] object-contain" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-white/40 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 font-inter leading-relaxed px-2"
          >
            We're building a friendly tech & cybersecurity community. Learn, build, code, and grow with us. Everyone is welcome — we're learners too.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            {user ? (
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="flex items-center gap-3 px-5 py-3 border border-blue-500/30 bg-blue-950/10 rounded-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-cyber text-xs text-white tracking-wide">{user.displayName || 'User'}</div>
                    <div className="text-white/40 text-xs font-inter">{user.email}</div>
                  </div>
                  {profile && (
                    <button onClick={() => onNavigate('/dashboard')} className="ml-2 p-2 text-white/40 hover:text-blue-400 transition-colors" title="Dashboard">
                      <LayoutDashboard className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={signOut} className="p-2 text-white/40 hover:text-red-400 transition-colors" title="Sign out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                  <a href="/events" onClick={goToEvents} className="btn-primary flex items-center justify-center gap-2 text-xs w-full xs:w-auto">
                    ENTER ARENA <ArrowRight className="w-4 h-4" />
                  </a>
                  <a href="https://discord.gg/heDDrcJJ2N" target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center justify-center gap-2 text-xs w-full xs:w-auto">
                    JOIN DISCORD <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                <a href="/events" onClick={goToEvents} className="btn-primary flex items-center justify-center gap-2 text-xs w-full xs:w-auto">
                  EXPLORE EVENTS <ArrowRight className="w-4 h-4" />
                </a>
                <a href="https://discord.gg/heDDrcJJ2N" target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center justify-center gap-2 text-xs w-full xs:w-auto">
                  JOIN DISCORD
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-25">
          <ChevronDown className="w-5 h-5 text-blue-400" />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">WHAT WE'RE BUILDING</p>
            <h2 className="font-cyber text-2xl sm:text-3xl md:text-4xl text-white mb-4">OUR <span className="gradient-text">VISION</span></h2>
            <div className="divider-gradient w-32 mx-auto opacity-50 mb-4" />
            <p className="text-white/40 font-inter text-sm max-w-xl mx-auto leading-relaxed">These are the pillars of CybroatriX — everything we're working toward, piece by piece.</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className="feature-card p-5 sm:p-6 rounded-sm"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center gradient-bg mb-4 sm:mb-5 rounded-sm">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-cyber text-sm sm:text-base text-white mb-2 sm:mb-3 tracking-wide">{title}</h3>
                <p className="text-white/40 text-sm font-inter leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Events CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">COMPETE & LEARN</p>
            <h2 className="font-cyber text-2xl sm:text-3xl md:text-4xl text-white mb-4">EVENT <span className="gradient-text">ARENA</span></h2>
            <div className="divider-gradient w-32 mx-auto opacity-50 mb-4" />
            <p className="text-white/40 font-inter text-sm max-w-xl mx-auto leading-relaxed">Join CTF competitions, workshops, and live sessions. Solve challenges, earn points, and climb the leaderboard.</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {arenaCards.map(({ icon: Icon, label, desc }) => (
              <motion.div key={label} variants={fadeUp} transition={{ duration: 0.5 }} className="feature-card p-5 rounded-sm text-center">
                <div className="w-12 h-12 flex items-center justify-center gradient-bg mb-3 rounded-sm mx-auto">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-cyber text-sm text-white mb-2 tracking-wide">{label.toUpperCase()}</h3>
                <p className="text-white/40 text-xs font-inter leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="text-center mt-8">
            <a href="/events" onClick={goToEvents} className="btn-primary inline-flex items-center gap-2 text-xs">
              ENTER CTF ARENA <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-20 px-4 sm:px-6"
      >
        <div className="max-w-4xl mx-auto text-center border border-blue-600/20 bg-gradient-to-b from-blue-950/10 to-transparent p-8 sm:p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
          <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 sm:mb-4">BE PART OF IT</p>
          <h2 className="font-cyber text-2xl sm:text-3xl md:text-4xl text-white mb-4 sm:mb-6">JOIN US <span className="gradient-text">EARLY</span></h2>
          <p className="text-white/40 font-inter text-sm sm:text-base mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            We're just getting started and building in public. Head to the arena to compete, create events, and track your scores.
          </p>
          <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href="/events" onClick={goToEvents} className="btn-primary flex items-center justify-center gap-2 text-xs w-full xs:w-auto">
              ENTER ARENA <ArrowRight className="w-4 h-4" />
            </a>
            <a href="https://discord.gg/heDDrcJJ2N" target="_blank" rel="noopener noreferrer" className="btn-outline text-xs w-full xs:w-auto text-center">
              JOIN DISCORD
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
