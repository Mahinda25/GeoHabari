import { Users, Target, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import imgImgDescr from "figma:asset/270e84f2c6561b96d084945bb687de635934997a.png";
import imgImgDescr1 from "figma:asset/7f87dc49ba985aa98948a8cbd411e7b7df260658.png";
import imgImgDescr2 from "figma:asset/dd826f068906f7b8b5377d4cecef83cbef99ca99.png";
import imgImgMap2 from "figma:asset/7e4deb782dae559953b69d86a10007bc367c937c.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
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

export function About() {
  return (
    <section id="about" className="relative max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px] py-[80px] md:py-[120px] lg:py-[140px] overflow-hidden">
      {/* Background map */}
      <motion.div 
        initial={{ opacity: 0, rotate: -5 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="absolute top-[20%] right-[-10%] w-[400px] md:w-[500px] h-[400px] md:h-[500px] opacity-[0.03] pointer-events-none"
      >
        <img src={imgImgMap2} alt="" className="w-full h-full object-cover" />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-[64px] md:space-y-[80px] lg:space-y-[96px]"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center max-w-[900px] mx-auto space-y-[20px] md:space-y-[24px]">
          <div className="flex items-center justify-center gap-[12px] mb-[12px] md:mb-[16px]">
            <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-r from-transparent to-[#783fc6]" />
            <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#783fc6] tracking-[2px]">ABOUT US</span>
            <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-l from-transparent to-[#783fc6]" />
          </div>
          <h2 className="font-['Bender',_sans-serif] text-[40px] md:text-[52px] lg:text-[56px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
            Empowering the African genius in every space
          </h2>
        </motion.div>

        {/* Value Props */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] md:gap-[32px] lg:gap-[40px]"
        >
          <ValueCard 
            icon={Target}
            title="Our Focus"
            description="Geohabari Podcast focuses on telling African tech stories by engaging the pioneers and juggernauts who have trodded the path."
            color="#783fc6"
          />
          <ValueCard 
            icon={Users}
            title="Our Guests"
            description="We talk to industry experts, designers, founders, aspiring professionals and students across the continent."
            color="#8dc63f"
          />
          <ValueCard 
            icon={Lightbulb}
            title="Our Mission"
            description="Empowering the African genius through authentic conversations, shared experiences, and actionable insights."
            color="#783fc6"
          />
        </motion.div>

        {/* Images */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] md:gap-[32px]"
        >
          <ImageCard src={imgImgDescr} />
          <ImageCard src={imgImgDescr1} />
          <ImageCard src={imgImgDescr2} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function ValueCard({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-[32px] md:p-[40px] rounded-[20px] md:rounded-[24px] border border-[#1d1d1d]/5 hover:border-[#783fc6]/20 hover:shadow-xl transition-all group"
    >
      <div className="space-y-[20px] md:space-y-[24px]">
        <div 
          className="w-[56px] md:w-[64px] h-[56px] md:h-[64px] rounded-[14px] md:rounded-[16px] flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}
        >
          <Icon className="w-[28px] md:w-[32px] h-[28px] md:h-[32px]" style={{ color }} />
        </div>
        <h3 className="font-['Bender',_sans-serif] text-[24px] md:text-[28px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
          {title}
        </h3>
        <p className="font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.6] text-[#1d1d1d]/70">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function ImageCard({ src }: { src: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative group overflow-hidden rounded-[20px] md:rounded-[24px]"
    >
      <img src={src} alt="" className="w-full h-[320px] md:h-[400px] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1d]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
