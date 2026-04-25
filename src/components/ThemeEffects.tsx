import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Sun, Moon, Cloud } from 'lucide-react';

// Perfectly centered glowing sphere behind the icon
const Trail = ({ color }: { color: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1, transition: { duration: 1.5, ease: "easeOut" } }}
    exit={{ opacity: 0, transition: { duration: 1.0 } }}
    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full ${color} blur-[70px] pointer-events-none -z-10`}
  />
);

export function ThemeEffects({ isDarkTheme }: { isDarkTheme: boolean }) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const [clouds, setClouds] = useState<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  const [parallaxClouds, setParallaxClouds] = useState<{ id: number; x: number; size: number; speed: number; opacity: number }[]>([]);

  // Parallax Scroll Hooks
  const { scrollY } = useScroll();
  
  // Sun/Moon move UP and out of the way fast
  const celestialY = useTransform(scrollY, [0, 400], [0, -500]);
  
  // Stars move UP slowly
  const starsY = useTransform(scrollY, [0, 600], [0, -200]);

  // Top clouds move UP
  const topCloudsY = useTransform(scrollY, [0, 600], [0, -300]);

  // Bottom clouds come UP from below the screen when scrolling down!
  const bottomCloudsY = useTransform(scrollY, [0, 800], ['120vh', '40vh']);

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

    // Generate normal top clouds
    const newClouds = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 40, // upper half
      size: Math.random() * 100 + 100,
      speed: Math.random() * 20 + 20, // seconds to cross screen
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setClouds(newClouds);

    // Generate parallax bottom clouds (these emerge from the bottom)
    const pClouds = Array.from({ length: 4 }).map((_, i) => ({
      id: i + 100,
      x: Math.random() * 100,
      size: Math.random() * 150 + 150, // Larger clouds at the bottom
      speed: Math.random() * 30 + 30, // Slower drifting
      opacity: Math.random() * 0.4 + 0.2,
    }));
    setParallaxClouds(pClouds);
  }, [isDarkTheme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Cinematic Day Sky Background */}
      <AnimatePresence>
        {!isDarkTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
            className="absolute inset-0 -z-20 bg-gradient-to-b from-blue-400 via-sky-200 to-orange-50"
          />
        )}
      </AnimatePresence>

      {/* Drifting Top Clouds */}
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
            style={{ top: `${cloud.y}%`, width: cloud.size, height: cloud.size, y: topCloudsY }}
          >
            <Cloud size={cloud.size} fill="currentColor" strokeWidth={0} opacity={isDarkTheme ? 0.2 : 0.6} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Parallax Bottom Clouds (Emerge on Scroll) */}
      <AnimatePresence>
        {parallaxClouds.map((cloud) => (
          <motion.div
            key={`pcloud-${cloud.id}-${isDarkTheme}`}
            initial={{ opacity: 0, x: '120vw' }}
            animate={{ 
              opacity: cloud.opacity, 
              x: '-20vw',
              transition: { 
                x: { duration: cloud.speed, ease: "linear", repeat: Infinity },
                opacity: { duration: 2 }
              }
            }}
            className={`absolute ${isDarkTheme ? 'text-gray-700' : 'text-white'} drop-shadow-2xl`}
            style={{ width: cloud.size, height: cloud.size, y: bottomCloudsY }}
          >
            <Cloud size={cloud.size} fill="currentColor" strokeWidth={0} opacity={isDarkTheme ? 0.3 : 0.8} />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div style={{ y: celestialY }} className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {!isDarkTheme && (
            <motion.div
              key="sun"
              initial={{ opacity: 0, x: '120vw', y: '15vh' }}
              animate={{ opacity: 1, x: '88vw', y: '10vh', transition: { duration: 2.5, type: 'spring', bounce: 0.3 } }}
              exit={{ opacity: 0, x: '-50vw', y: '15vh', transition: { duration: 1.5, ease: "easeIn" } }}
              className="absolute origin-center flex items-center justify-center"
              style={{ width: 250, height: 250, marginLeft: '-125px', marginTop: '-125px' }}
            >
              <Trail color="bg-orange-500/20" />
              {/* Rotating Plasma Corona */}
              <motion.div 
                className="absolute rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                style={{
                  width: '180px',
                  height: '180px',
                  background: 'conic-gradient(from 0deg, #ff6f00, #ffb300, #ff6f00, #e65100, #ff6f00)',
                  filter: 'blur(12px)',
                  opacity: 0.8
                }}
              />
              {/* Hyper-realistic Pulsing Core */}
              <motion.div 
                className="absolute rounded-full"
                animate={{ 
                  scale: [1, 1.02, 1],
                  opacity: [0.95, 1, 0.95]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: '140px',
                  height: '140px',
                  background: 'radial-gradient(circle at center, #ffffff 0%, #fffde7 20%, #ffc107 50%, #e65100 85%, #bf360c 100%)',
                  boxShadow: `
                    0 0 50px 15px rgba(255, 255, 255, 0.9),
                    0 0 100px 40px rgba(255, 213, 79, 0.8),
                    0 0 160px 80px rgba(255, 143, 0, 0.6),
                    0 0 280px 120px rgba(230, 81, 0, 0.4)
                  `
                }}
              />
            </motion.div>
          )}
          
          {isDarkTheme && (
            <motion.div
              key="moon"
              initial={{ opacity: 0, x: '120vw', y: '15vh', scale: 0.5 }}
              animate={{ opacity: 1, x: '88vw', y: '10vh', scale: 1, transition: { duration: 2.5, type: 'spring', bounce: 0.3 } }}
              exit={{ opacity: 0, x: '-50vw', y: '15vh', transition: { duration: 1.5, ease: "easeIn" } }}
              className="absolute origin-center flex items-center justify-center"
              style={{ width: 250, height: 250, marginLeft: '-125px', marginTop: '-125px' }}
            >
              <Trail color="bg-blue-200/10" />
              {/* Hyper-realistic Moon */}
              <div 
                className="absolute rounded-full overflow-hidden"
                style={{
                  width: '140px',
                  height: '140px',
                  background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e5e7eb 20%, #9ca3af 50%, #4b5563 80%, #1f2937 100%)',
                  boxShadow: `
                    inset -35px -35px 50px rgba(0,0,0,0.85),
                    inset 12px 12px 25px rgba(255,255,255,0.9),
                    0 0 40px 15px rgba(255, 255, 255, 0.3),
                    0 0 100px 50px rgba(147, 197, 253, 0.15),
                    0 0 200px 100px rgba(96, 165, 250, 0.05)
                  `
                }}
              >
                {/* Deeply textured lunar craters with highlighted rims */}
                <div className="absolute top-[18%] left-[28%] w-[26%] h-[26%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 60%)', boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.3), 1px 1px 3px rgba(255,255,255,0.5)' }} />
                <div className="absolute top-[52%] left-[54%] w-[32%] h-[32%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, transparent 60%)', boxShadow: 'inset 5px 5px 12px rgba(0,0,0,0.4), 1px 1px 3px rgba(255,255,255,0.4)' }} />
                <div className="absolute top-[65%] left-[22%] w-[18%] h-[18%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.15) 0%, transparent 60%)', boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.25), 1px 1px 2px rgba(255,255,255,0.3)' }} />
                <div className="absolute top-[35%] left-[68%] w-[14%] h-[14%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 60%)', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), 1px 1px 1px rgba(255,255,255,0.2)' }} />
                {/* Subtle surface scarring/mare */}
                <div className="absolute top-[30%] left-[10%] w-[40%] h-[30%] rounded-full rotate-45" style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)', filter: 'blur(2px)' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isDarkTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 2 } }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="absolute inset-0 pointer-events-none"
            style={{ y: starsY }}
          >
            <div id="stars" className="absolute top-0 left-0"></div>
            <div id="stars2" className="absolute top-0 left-0"></div>
            <div id="stars3" className="absolute top-0 left-0"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
