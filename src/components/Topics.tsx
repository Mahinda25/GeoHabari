import { Briefcase, GraduationCap, Plane, Laugh, Globe2, Code, Zap } from "lucide-react";
import { motion } from "motion/react";

const topics = [
  {
    title: "CAREER",
    description: "Navigate diverse career paths in the geospatial industry. Discussing pivotal moments, key learnings, and challenges.",
    icon: Briefcase,
    color: "#783fc6"
  },
  {
    title: "ACADEMIA",
    description: "Discover African organizations leading in geo-enabling and other cutting-edge technologies.",
    icon: GraduationCap,
    color: "#8dc63f"
  },
  {
    title: "STUDY ABROAD",
    description: "Scholarship recipients share their application tips and tricks, covering everything from requirements to living abroad.",
    icon: Plane,
    color: "#783fc6"
  },
  {
    title: "BANTER",
    description: "Blend technical expertise with humor to humanize experiences in the tech world.",
    icon: Laugh,
    color: "#8dc63f"
  },
  {
    title: "EARTH",
    description: "Dive into Earth Observation use cases across various sectors and their real-world applications.",
    icon: Globe2,
    color: "#783fc6"
  },
  {
    title: "TECH",
    description: "Explore cutting-edge technologies, from programming languages to seamless integrations.",
    icon: Code,
    color: "#8dc63f"
  },
  {
    title: "ACTION",
    description: "Explore how tech is used across Africa to drive change and create impactful solutions.",
    icon: Zap,
    color: "#783fc6"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export function Topics() {
  return (
    <section className="bg-white py-[80px] md:py-[120px] lg:py-[140px]">
      <div className="max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-[60px] md:space-y-[80px]"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-[800px] mx-auto space-y-[20px] md:space-y-[24px]">
            <div className="flex items-center justify-center gap-[12px] mb-[12px] md:mb-[16px]">
              <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-r from-transparent to-[#8dc63f]" />
              <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#8dc63f] tracking-[2px]">TOPICS</span>
              <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-l from-transparent to-[#8dc63f]" />
            </div>
            <h2 className="font-['Bender',_sans-serif] text-[40px] md:text-[52px] lg:text-[56px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
              Conversations that cut across the board
            </h2>
            <p className="font-['Bender',_sans-serif] text-[16px] md:text-[18px] lg:text-[20px] leading-[1.6] text-[#1d1d1d]/70">
              From career guidance to technical deep-dives, we cover the full spectrum of African tech innovation
            </p>
          </motion.div>

          {/* Topics Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] md:gap-[28px] lg:gap-[32px]"
          >
            {topics.map((topic, index) => (
              <TopicCard key={index} {...topic} />
            ))}
            
            {/* More Topics Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-[#783fc6]/5 to-[#8dc63f]/5 p-[40px] md:p-[48px] rounded-[20px] md:rounded-[24px] border-2 border-dashed border-[#783fc6]/20 flex items-center justify-center"
            >
              <p className="font-['Bender',_sans-serif] text-[28px] md:text-[32px] leading-[1.3] text-[#1d1d1d] text-center" style={{ fontWeight: 700 }}>
                And so much more...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function TopicCard({ title, description, icon: Icon, color }: { title: string; description: string; icon: any; color: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-[32px] md:p-[40px] rounded-[20px] md:rounded-[24px] border border-[#1d1d1d]/5 hover:border-[#783fc6]/30 hover:shadow-2xl transition-all group cursor-pointer"
    >
      <div className="flex flex-col h-full gap-[20px] md:gap-[24px]">
        {/* Icon */}
        <div 
          className="w-[64px] md:w-[72px] h-[64px] md:h-[72px] rounded-[14px] md:rounded-[16px] flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}05)` }}
        >
          <Icon className="w-[32px] md:w-[36px] h-[32px] md:h-[36px]" style={{ color }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-[14px] md:space-y-[16px]">
          <h3 className="font-['Bender',_sans-serif] text-[24px] md:text-[28px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
            {title}
          </h3>
          <p className="font-['Bender',_sans-serif] text-[14px] md:text-[15px] leading-[1.6] text-[#1d1d1d]/70">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center gap-[8px] text-[#783fc6] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-['Bender',_sans-serif] text-[13px] md:text-[14px] leading-[1.2]">Explore</span>
          <svg className="w-[14px] md:w-[16px] h-[14px] md:h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
