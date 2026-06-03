import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

export default function AnimatedButton({ children }: Props) {
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
        boxShadow: "0 0 25px rgba(139,92,246,0.6)",
      }}
      whileTap={{
        scale: 0.95,
      }}
      className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium"
    >
      {children}
    </motion.button>
  );
}
