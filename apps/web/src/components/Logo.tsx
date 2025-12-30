import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'light' | 'dark';
  showTitle?: boolean;
  animate?: boolean;
  className?: string;
}

const sizes = {
  sm: { card: 'w-8 h-11', text: 'text-xl', emoji: 'text-lg', corner: 'text-[5px]' },
  md: { card: 'w-14 h-20', text: 'text-5xl', emoji: 'text-3xl', corner: 'text-[8px]' },
  lg: { card: 'w-20 h-28', text: 'text-6xl', emoji: 'text-5xl', corner: 'text-[10px]' },
};

const variants = {
  gold: {
    glow: 'bg-accent-gold/30',
    border: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
    bg: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
    text: 'text-accent-gold',
    corner: 'text-accent-gold',
    shadow: '0 0 20px rgba(212, 175, 55, 0.3), 0 10px 40px rgba(0,0,0,0.5)',
    emojiFilter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))',
  },
  light: {
    glow: 'bg-white/20',
    border: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)',
    bg: 'linear-gradient(135deg, #2a3441 0%, #1a2230 100%)',
    text: 'text-white',
    corner: 'text-white/80',
    shadow: '0 0 20px rgba(255, 255, 255, 0.2), 0 10px 40px rgba(0,0,0,0.5)',
    emojiFilter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
  },
  dark: {
    glow: 'bg-accent-gold/20',
    border: 'linear-gradient(135deg, #d4af37 0%, #b8972e 50%, #d4af37 100%)',
    bg: 'linear-gradient(135deg, #0a0f14 0%, #050709 100%)',
    text: 'text-accent-gold',
    corner: 'text-accent-gold/80',
    shadow: '0 0 15px rgba(212, 175, 55, 0.2), 0 8px 30px rgba(0,0,0,0.6)',
    emojiFilter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.4))',
  },
};

export function Logo({ 
  size = 'md', 
  variant = 'gold', 
  showTitle = true, 
  animate = true,
  className = '' 
}: LogoProps) {
  const s = sizes[size];
  const v = variants[variant];

  const CardComponent = animate ? motion.div : 'div';
  const TitleComponent = animate ? motion.span : 'span';

  const cardAnimationProps = animate ? {
    initial: { opacity: 0, rotate: -45, scale: 0.3, y: -20 },
    animate: { opacity: 1, rotate: -15, scale: 1, y: 0 },
    transition: { delay: 0.1, duration: 0.6, type: "spring", bounce: 0.4 },
    whileHover: { rotate: -8, scale: 1.05 },
  } : {};

  const titleAnimationProps = animate ? {
    initial: { opacity: 0, scale: 0.9, x: -10 },
    animate: { opacity: 1, scale: 1, x: 0 },
    transition: { delay: 0.2, duration: 0.5 },
  } : {};

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Card logo */}
      <CardComponent
        {...cardAnimationProps}
        className="relative cursor-pointer"
      >
        {/* Glow effect */}
        <div className={`absolute -inset-2 ${v.glow} rounded-xl blur-xl animate-pulse`} />
        
        {/* Main card */}
        <div 
          className={`relative ${s.card} rounded-xl overflow-hidden shadow-2xl`}
          style={{ 
            background: v.bg,
            boxShadow: v.shadow,
          }}
        >
          {/* Border gradient */}
          <div 
            className="absolute inset-0 rounded-xl p-[2px]"
            style={{ background: v.border }}
          >
            <div 
              className="w-full h-full rounded-[10px]"
              style={{ background: v.bg }}
            />
          </div>
          
          {/* Joker emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={s.emoji} 
              style={{ filter: v.emojiFilter }}
            >
              🃏
            </span>
          </div>
          
          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl pointer-events-none" />
          
          {/* Corner decorations */}
          <div className={`absolute top-1 left-1.5 ${s.corner} ${v.corner} font-bold`}>V</div>
          <div className={`absolute bottom-1 right-1.5 ${s.corner} ${v.corner} font-bold rotate-180`}>V</div>
        </div>
      </CardComponent>
      
      {/* Title */}
      {showTitle && (
        <TitleComponent
          {...titleAnimationProps}
          className={`font-serif font-bold ${s.text} ${v.text} text-shadow-gold`}
        >
          Valepaska
        </TitleComponent>
      )}
    </div>
  );
}

