import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type EventCard = {
  title: string;
  category: string;
  src: string;
  color: string;
};

export const HeroCardStack = ({
  items,
  autoplay = true,
}: {
  items: EventCard[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + items.length) % items.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 4000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 10) - 5;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="relative h-[400px] md:h-[500px] w-full flex items-center justify-center perspective-1000">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            // Determine stacking order based on distance from active
            // active is 0, next is 1, prev is length-1
            
            // Simplified logic: render all, control z-index
            const isCurrent = index === active;
            
            return (
              <motion.div
                key={item.src}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  z: -100,
                  rotate: randomRotateY(),
                  y: 50,
                  x: "-50%" // Initial centering X
                }}
                animate={{
                  opacity: isCurrent ? 1 : 0.4,
                  scale: isCurrent ? 1 : 0.9,
                  z: isCurrent ? 0 : -50,
                  rotate: isCurrent ? 0 : (index - active) * 2,
                  zIndex: isCurrent
                    ? 50
                    : 50 - Math.abs(active - index),
                  y: isCurrent ? "-50%" : "-45%", // Centering Y with offset
                  x: isCurrent 
                      ? "-50%" 
                      : `calc(-50% + ${(index - active) * 20}px)` // Centering X with offset
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  z: -100,
                  rotate: randomRotateY(),
                  y: 50,
                  x: "-50%"
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
                className="absolute w-[300px] md:w-[380px] h-[450px] md:h-[550px] rounded-[2rem] shadow-2xl overflow-hidden origin-center border-4 border-white/20"
                style={{
                    left: '50%',
                    top: '50%',
                }}
              >
                {/* Image */}
                <img
                  src={item.src}
                  alt={item.title}
                  draggable={false}
                  className="h-full w-full object-cover object-center"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isCurrent ? 1 : 0, y: isCurrent ? 0 : 20 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 text-white uppercase tracking-wider`} style={{ backgroundColor: item.color }}>
                            {item.category}
                        </span>
                        <h3 className="text-3xl font-bold text-white leading-tight mb-2">
                            {item.title}
                        </h3>
                    </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Navigation Buttons - Floating */}
        <div className="absolute bottom-[-60px] flex gap-6 z-50">
            <button
              onClick={handlePrev}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center group transition-all text-gray-600 hover:text-gray-900 shadow-lg"
            >
              <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center group transition-all text-gray-600 hover:text-gray-900 shadow-lg"
            >
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};
