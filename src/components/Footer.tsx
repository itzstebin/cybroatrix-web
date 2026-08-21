import { Github, Linkedin, Youtube, Instagram, MessageCircle, Send, Twitter } from 'lucide-react';

const socialLinks = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/CybroatriX', color: 'hover:text-white' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/in/cybroatrix/', color: 'hover:text-blue-400' },
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/channel/UCJ2NRYL7SNsJ6GkhncXsPgw', color: 'hover:text-red-400' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/cybroatrix', color: 'hover:text-pink-400' },
  { icon: Send, label: 'Telegram', href: 'https://t.me/Cybroatrix', color: 'hover:text-cyan-400' },
  { icon: Twitter, label: 'X / Twitter', href: 'https://x.com/CybroatriX', color: 'hover:text-sky-400' },
  { icon: MessageCircle, label: 'Discord', href: 'https://discord.gg/heDDrcJJ2N', color: 'hover:text-indigo-400' },
];

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-blue-900/20 bg-[#070709]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            {/* Logo: CYBROATRI + X image */}
            <div className="flex items-center gap-0 mb-4">
              <span className="font-cyber text-xl text-white tracking-widest leading-none">
                CYBROATRI
              </span>
              <img
                src="/images/ChatGPT_Image_Jul_4,_2026,_07_31_08_PM.png"
                alt="X"
                className="w-6 h-6 object-contain -ml-0.5"
              />
            </div>
            <p className="text-white/40 text-sm leading-relaxed font-inter mb-6 max-w-xs">
              Connecting the cyber community worldwide. We connect professionals, innovate solutions, and empower digital security.
            </p>
            <p className="font-cyber text-xs tracking-[0.25em] text-blue-400/60">
              CONNECT • INNOVATE • EMPOWER
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-cyber text-xs text-white/40 tracking-widest mb-6">NAVIGATION</h4>
            <div className="flex flex-col gap-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About Us' },
                { id: 'services', label: 'Services' },
                { id: 'events', label: 'Events' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className="text-white/50 hover:text-white text-sm font-rajdhani tracking-wide transition-colors text-left w-fit"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-cyber text-xs text-white/40 tracking-widest mb-6">CONNECT WITH US</h4>
            <div className="flex flex-col gap-3">
              {socialLinks.map(({ icon: Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 text-white/40 ${color} transition-colors`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-rajdhani tracking-wide">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-gradient my-8 sm:my-10 opacity-30" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm font-inter text-center sm:text-left">
            &copy; 2026 CybroatriX. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-cyber text-xs text-white/25 tracking-widest">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
