import { motion } from "framer-motion";

const transition = {
  duration: 1.2,
  repeat: Infinity,
  ease: [0.42, 0, 0.58, 1] as const,
};

interface LogoLoaderProps {
  className?: string;
}

export default function LogoLoader({ className = "" }: LogoLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px rgba(124,58,237,0.4)",
            "0 0 50px rgba(124,58,237,0.8)",
            "0 0 20px rgba(124,58,237,0.4)",
          ],
        }}
        transition={transition}
        className="w-44 h-44 rounded-[44px] bg-gradient-to-br from-violet-700 to-purple-600 flex items-center justify-center relative"
      >
        {/* Vertical Line */}
        <div className="absolute left-[42px] h-20 w-[3px] bg-violet-300 rounded-full" />

        {/* Top Check */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={transition}
          className="absolute top-8 left-8 w-5 h-5 rounded-full bg-violet-300 flex items-center justify-center text-white text-xs"
        >
          ✓
        </motion.div>

        {/* Moving Progress Dot */}
        <motion.div
          animate={{
            y: [35, 0, -35],
          }}
          transition={transition}
          className="absolute left-[30px] w-6 h-6 rounded-full bg-pink-500"
        />

        {/* Bottom Circle */}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={transition}
          className="absolute bottom-8 left-8 w-5 h-5 rounded-full border-2 border-violet-300"
        />

        {/* Task Lines */}
        <div className="flex flex-col gap-5 ml-10">
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={transition}
            className="w-20 h-3 rounded-full bg-violet-300"
          />

          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={transition}
            className="w-28 h-3 rounded-full bg-white"
          />

          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={transition}
            className="w-16 h-3 rounded-full bg-violet-300"
          />
        </div>
      </motion.div>
    </div>
  );
}
