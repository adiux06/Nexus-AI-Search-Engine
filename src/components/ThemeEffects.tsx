import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Cloud } from 'lucide-react';

export function ThemeEffects({ isDarkTheme }: { isDarkTheme: boolean }) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const [clouds, setClouds] = useState<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    // Generate stars
    if (isDarkTheme) {
      const newStars = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        delay: Math.random() * 2,
      }));
      setStars(newStars);
    } else {
      setStars([]);
    }

    // Generate clouds (always present but change styling based on theme)
    const newClouds = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 40, // upper half
      size: Math.random() * 100 + 100,
      speed: Math.random() * 20 + 20, // seconds to cross screen
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setClouds(newClouds);
  }, [isDarkTheme]);

  // Perfectly centered glowing sphere behind the icon
  const Trail = ({ color }: { color: string }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 1.5, ease: "easeOut" } }}
      exit={{ opacity: 0, transition: { duration: 1.0 } }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full ${color} blur-[70px] pointer-events-none -z-10`}
    />
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Drifting Clouds */}
      <AnimatePresence>
        {clouds.map((cloud) => (
          <motion.div
            key={`cloud-${cloud.id}-${isDarkTheme}`}
            initial={{ opacity: 0, x: '120vw' }}
            animate={{ 
              opacity: cloud.opacity, 
              x: '-20vw',
              transition: { 
                x: { duration: cloud.speed, ease: "linear", repeat: Infinity },
                opacity: { duration: 2 }
              }
            }}
            className={`absolute ${isDarkTheme ? 'text-gray-600' : 'text-white'} drop-shadow-xl`}
            style={{ top: `${cloud.y}%`, width: cloud.size, height: cloud.size }}
          >
            <Cloud size={cloud.size} fill="currentColor" strokeWidth={0} opacity={isDarkTheme ? 0.2 : 0.6} />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {!isDarkTheme && (
          <motion.div
            key="sun"
            initial={{ opacity: 0, x: '120vw', y: '15vh', rotate: 90 }}
            animate={{ opacity: 1, x: '88vw', y: '10vh', rotate: 0, transition: { duration: 2.5, type: 'spring', bounce: 0.3 } }}
            exit={{ opacity: 0, x: '-50vw', y: '15vh', rotate: -180, transition: { duration: 1.5, ease: "easeIn" } }}
            className="absolute text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] origin-center flex items-center justify-center"
            style={{ width: 250, height: 250, marginLeft: '-125px', marginTop: '-125px' }}
          >
            <Trail color="bg-yellow-400/30" />
            <Sun size={250} strokeWidth={1} fill="currentColor" />
          </motion.div>
        )}
        
        {isDarkTheme && (
          <motion.div
            key="moon"
            initial={{ opacity: 0, x: '120vw', y: '15vh', rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, x: '88vw', y: '10vh', rotate: 0, scale: 1, transition: { duration: 2.5, type: 'spring', bounce: 0.3 } }}
            exit={{ opacity: 0, x: '-50vw', y: '15vh', rotate: -90, transition: { duration: 1.5, ease: "easeIn" } }}
            className="absolute text-slate-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] origin-center flex items-center justify-center"
            style={{ width: 250, height: 250, marginLeft: '-125px', marginTop: '-125px' }}
          >
            <Trail color="bg-blue-200/20" />
            <Moon size={250} strokeWidth={1} fill="currentColor" className="text-slate-100" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDarkTheme && stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0, x: 0, scaleX: 1, scaleY: 1 }}
            animate={{ 
              opacity: [0, 0.8, 0.2, 0.9, 0.3], 
              scaleX: 1,
              scaleY: 1,
              x: 0,
              transition: { 
                delay: 1.0 + star.delay,
                opacity: { duration: 3 + Math.random() * 3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
              } 
            }}
            exit={{ 
              opacity: [0.8, 0], 
              x: '-100vw', 
              scaleX: 40, // stretches out into a long tail
              scaleY: 0.5, // becomes thinner
              transition: { duration: 1.0, ease: "easeIn", delay: Math.random() * 0.3 } 
            }}
            className="absolute rounded-full bg-white origin-right"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.8)`
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
