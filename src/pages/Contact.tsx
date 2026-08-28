import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Github, Linkedin, ExternalLink, Mail, Loader2, Heart, HandHeart, Users
} from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, push } from 'firebase/database';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const reduceMotion = useReducedMotion();

  const sectionReveal = reduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 }, viewport: { once: true } }
    : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

  const fadeUp = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.1 } },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormState('submitting');
    setErrorMsg('');
    try {
      await push(ref(db, 'messages'), { name: formData.name.trim(), email: formData.email.trim(), subject: formData.subject.trim(), message: formData.message.trim(), sentAt: new Date().toISOString() });
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setFormState('error');
      setErrorMsg('Something went wrong. Please try again or reach us on Discord.');
    }
  };

  const resetForm = () => setFormState('idle');

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
          <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 sm:mb-4">GET IN TOUCH</p>
          <h1 className="font-cyber text-3xl sm:text-4xl md:text-5xl text-white mb-5 sm:mb-6">
            CONTACT <span className="gradient-text">US</span>
          </h1>
          <div className="divider-gradient w-20 sm:w-24 mx-auto opacity-50 mb-6 sm:mb-8" />
          <p className="text-white/50 font-inter text-base sm:text-lg leading-relaxed mb-8">
            Find us on social platforms or send us a message. We read everything.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="https://github.com/CybroatriX" target="_blank" rel="noopener noreferrer" aria-label="CybroatriX on GitHub" className="w-11 h-11 flex items-center justify-center border border-blue-900/30 text-white/50 hover:text-white hover:border-blue-500/40 transition-colors rounded-sm">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/cybroatrix/" target="_blank" rel="noopener noreferrer" aria-label="CybroatriX on LinkedIn" className="w-11 h-11 flex items-center justify-center border border-blue-900/30 text-white/50 hover:text-blue-400 hover:border-blue-500/40 transition-colors rounded-sm">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Donation / Sponsors */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-10 sm:mb-12">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">SUPPORT US</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">
              DONATIONS & <span className="gradient-text">SPONSORS</span>
            </h2>
            <div className="divider-gradient w-24 mx-auto opacity-50 mb-4" />
            <p className="text-white/40 font-inter text-sm max-w-xl mx-auto leading-relaxed">
              CybroatriX is a community project built with passion. If you'd like to support what we're building, here's how you can help.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Donations */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="feature-card p-6 sm:p-8 rounded-sm">
              <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-bg flex items-center justify-center mb-5 sm:mb-6 rounded-sm">
                <HandHeart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-cyber text-base sm:text-lg text-white mb-3 tracking-wide">DONATE</h3>
              <p className="text-white/40 font-inter text-sm mb-6 leading-relaxed">
                Help us keep the servers running and fund future events. Every contribution matters, no matter the size.
              </p>
              <div className="space-y-3">
                <a href="https://ko-fi.com/cybroatrix" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors rounded-sm group">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-cyber text-xs text-white tracking-wide">Ko-fi</div>
                    <div className="text-white/30 text-xs font-inter">ko-fi.com/cybroatrix</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-orange-400 transition-colors ml-auto flex-shrink-0" />
                </a>
                <a href="https://www.buymeacoffee.com/cybroatrix" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors rounded-sm group">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-cyber text-xs text-white tracking-wide">Buy Me a Coffee</div>
                    <div className="text-white/30 text-xs font-inter">buymeacoffee.com/cybroatrix</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-yellow-400 transition-colors ml-auto flex-shrink-0" />
                </a>
              </div>
            </motion.div>

            {/* Sponsors */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="feature-card p-6 sm:p-8 rounded-sm">
              <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-bg flex items-center justify-center mb-5 sm:mb-6 rounded-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-cyber text-base sm:text-lg text-white mb-3 tracking-wide">BECOME A SPONSOR</h3>
              <p className="text-white/40 font-inter text-sm mb-6 leading-relaxed">
                Looking to sponsor our events, CTFs, or the platform itself? We'd love to partner with organizations that support the community.
              </p>
              <div className="border border-blue-600/30 bg-blue-950/10 p-4 sm:p-5 rounded-sm">
                <p className="text-white/50 font-inter text-sm mb-4">
                  For sponsorship inquiries, reach out to us directly:
                </p>
                <a href="mailto:sponsors@cybroatrix.com" className="inline-flex items-center gap-2 font-cyber text-xs text-blue-400 hover:text-blue-300 transition-colors tracking-wide">
                  <Mail className="w-4 h-4" />
                  sponsors@cybroatrix.com
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-blue-900/20">
        <motion.div {...sectionReveal} className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3">SEND A MESSAGE</p>
            <h2 className="font-cyber text-2xl sm:text-3xl text-white mb-4">REACH <span className="gradient-text">OUT</span></h2>
            <div className="divider-gradient w-24 mx-auto opacity-50 mb-3 sm:mb-4" />
            <p className="text-white/40 font-inter text-sm">For business inquiries, partnerships, or just to say hi. We read every message.</p>
          </div>

          <AnimatePresence mode="wait">
            {formState === 'success' ? (
              <motion.div
                key="success"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="feature-card p-8 sm:p-10 rounded-sm text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 gradient-bg flex items-center justify-center rounded-sm mx-auto mb-5 sm:mb-6">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="font-cyber text-lg sm:text-xl text-white mb-3 tracking-wide">MESSAGE SENT!</h3>
                <p className="text-white/40 font-inter text-sm leading-relaxed mb-6">We'll get back to you soon. In the meantime, join us on Discord.</p>
                <div className="flex flex-col xs:flex-row gap-3 justify-center">
                  <a href="https://discord.gg/heDDrcJJ2N" target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">JOIN DISCORD</a>
                  <button onClick={resetForm} className="btn-outline text-xs">SEND ANOTHER</button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="feature-card rounded-sm p-6 sm:p-8 space-y-4 sm:space-y-5"
              >
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">NAME *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={formState === 'submitting'} placeholder="Your name" className="input-cyber w-full disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">EMAIL *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={formState === 'submitting'} placeholder="your@email.com" className="input-cyber w-full disabled:opacity-50" />
                  </div>
                </div>
                <div>
                  <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">SUBJECT</label>
                  <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} disabled={formState === 'submitting'} placeholder="What's this about?" className="input-cyber w-full disabled:opacity-50" />
                </div>
                <div>
                  <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">MESSAGE *</label>
                  <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required disabled={formState === 'submitting'} rows={5} placeholder="Tell us how we can help..." className="input-cyber w-full resize-none disabled:opacity-50" />
                </div>
                {formState === 'error' && <p className="text-red-400/80 text-xs font-inter border border-red-500/20 bg-red-950/10 px-4 py-3">{errorMsg}</p>}
                <button type="submit" disabled={formState === 'submitting'} className="btn-primary w-full font-cyber text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {formState === 'submitting' ? (<><Loader2 className="w-4 h-4 animate-spin" />SENDING...</>) : 'SEND MESSAGE'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
