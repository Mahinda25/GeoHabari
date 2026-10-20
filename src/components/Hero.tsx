import { Play, Sparkles, Globe, Zap } from "lucide-react";
import { motion } from "motion/react";
import imgImage from "figma:asset/1352f162da52bebf85330249593a4f24b0f7d037.png";
import imgImage1 from "figma:asset/645be3125f3e5f631423a05a520c1cc8c295554b.png";
import imgImage2 from "figma:asset/7f03fc01bccfb9da5887d4de41822988c444dd14.png";
import imgImgProfile from "figma:asset/a5496bed0226780b21a0fda5e2b448a06b4b31f3.png";
import imgImgProfile1 from "figma:asset/81a3cc16a07da8ccd7785c48ed72d98a474be138.png";
import imgImgProfile2 from "figma:asset/e2550974c0fc18ecc04173968b5a7cdb4eacc065.png";
import imgImgProfile3 from "figma:asset/82e8fad710caac30d5e66406d64fd868406ed518.png";
import imgImgMap from "figma:asset/654fbbb19d54a2e3f2616b9e2cc089d0dad6552c.png";
import imgImgMap1 from "figma:asset/0da2dba8a451cff7503cbc8d25297125ecc1249a.png";
import imgImgMap2 from "figma:asset/7e4deb782dae559953b69d86a10007bc367c937c.png";

export function Hero() {
  return (
    <section className="relative max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px] py-[60px] md:py-[100px] lg:py-[120px] overflow-hidden">
      {/* Decorative map backgrounds */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-[5%] left-[-5%] w-[250px] md:w-[350px] h-[250px] md:h-[350px] opacity-[0.04] pointer-events-none hidden lg:block"
      >
        <img src={imgImgMap} alt="" className="w-full h-full object-cover" />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute bottom-[10%] right-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] opacity-[0.04] pointer-events-none hidden lg:block"
      >
        <img src={imgImgMap1} alt="" className="w-full h-full object-cover" />
      </motion.div>

      {/* Gradient blobs */}
      <div className="absolute top-[10%] right-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-[#8dc63f]/5 rounded-full blur-[120px] pointer-events-none hidden lg:block" />
      <div className="absolute bottom-[10%] left-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-[#783fc6]/5 rounded-full blur-[120px] pointer-events-none hidden lg:block" />
      
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-[60px] md:gap-[80px] lg:gap-[100px]">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-[40px] md:gap-[56px] flex-1 w-full lg:w-auto lg:max-w-[650px] order-2 lg:order-1"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-[12px] bg-gradient-to-r from-[#783fc6]/10 to-[#8dc63f]/10 px-[20px] md:px-[24px] py-[10px] md:py-[12px] rounded-full border border-[#783fc6]/20 self-start mx-auto lg:mx-0"
          >
            <Sparkles className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] text-[#783fc6]" />
            <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#783fc6]">African Tech Stories</span>
          </motion.div>
          
          <div className="space-y-[24px] md:space-y-[32px] text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-['Bender',_sans-serif] text-[40px] md:text-[56px] lg:text-[72px] leading-[1.1] text-[#1d1d1d]" 
              style={{ fontWeight: 800 }}
            >
              Amplifying African tech stories <span className="text-[#8dc63f]">&</span> building tech brilliance.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-['Bender',_sans-serif] text-[16px] md:text-[20px] lg:text-[24px] leading-[1.5] text-[#1d1d1d]/70"
            >
              Catalysing <span className="text-[#783fc6] font-semibold">spiritual</span>, <span className="text-[#783fc6] font-semibold">social</span> and <span className="text-[#783fc6] font-semibold">economic</span> renewal in our immediate communities and as a result the world
            </motion.p>
          </div>
          
          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col gap-[24px] md:gap-[32px] items-center lg:items-start"
          >
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center gap-[12px] md:gap-[16px] bg-[#783fc6] hover:bg-[#6a35b5] px-[32px] md:px-[40px] py-[16px] md:py-[20px] rounded-[16px] font-['Bender',_sans-serif] text-[20px] md:text-[24px] lg:text-[28px] leading-[1.2] text-[#f9f9f9] transition-colors hover:shadow-2xl hover:shadow-[#783fc6]/20 group w-full sm:w-auto"
            >
              <Play className="w-[24px] md:w-[28px] h-[24px] md:h-[28px] fill-white" />
              <span style={{ fontWeight: 700, letterSpacing: '2px' }}>LISTEN NOW</span>
            </motion.button>
            
            <div className="flex items-center gap-[24px] md:gap-[32px]">
              <PlatformIcon src={imgImage} label="Spotify" delay={0.6} />
              <PlatformIcon src={imgImage1} label="Apple" delay={0.65} />
              <PlatformIcon src={imgImage2} label="Addict" delay={0.7} />
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex items-center justify-center lg:justify-start gap-[32px] md:gap-[48px] pt-[16px] md:pt-[24px] border-t border-[#1d1d1d]/10"
          >
            <StatItem icon={Globe} value="50+" label="Episodes" />
            <StatItem icon={Zap} value="10K+" label="Listeners" />
          </motion.div>
        </motion.div>
        
        {/* Right - Guest Grid */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative flex-shrink-0 w-full max-w-[400px] sm:max-w-[450px] lg:max-w-[500px] order-1 lg:order-2"
        >
          <div className="grid grid-cols-2 gap-[16px] md:gap-[20px] lg:gap-[24px]">
            <div className="space-y-[16px] md:space-y-[20px] lg:space-y-[24px]">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative w-full pb-[100%]"
              >
                <img 
                  src={imgImgProfile} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover rounded-[16px] md:rounded-[20px] lg:rounded-[24px] shadow-xl" 
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative w-full pb-[100%]"
              >
                <img 
                  src={imgImgProfile1} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover rounded-full shadow-xl" 
                />
              </motion.div>
            </div>
            <div className="space-y-[16px] md:space-y-[20px] lg:space-y-[24px] pt-[30px] md:pt-[50px] lg:pt-[60px]">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative w-full pb-[100%]"
              >
                <img 
                  src={imgImgProfile2} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover rounded-full shadow-xl" 
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative w-full pb-[100%]"
              >
                <img 
                  src={imgImgProfile3} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover rounded-[16px] md:rounded-[20px] lg:rounded-[24px] shadow-xl" 
                />
              </motion.div>
            </div>
          </div>
          
          {/* Floating badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            whileHover={{ y: -2 }}
            className="absolute -bottom-[12px] -right-[12px] md:-bottom-[16px] md:-right-[16px] lg:-bottom-[20px] lg:-right-[20px] bg-[#8dc63f] text-white px-[16px] md:px-[20px] lg:px-[24px] py-[8px] md:py-[10px] lg:py-[12px] rounded-full shadow-xl"
          >
            <span className="font-['Bender',_sans-serif] text-[11px] md:text-[12px] lg:text-[14px] leading-[1.2] whitespace-nowrap" style={{ fontWeight: 700 }}>NEW EPISODE WEEKLY</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PlatformIcon({ src, label, delay }: { src: string; label: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
      className="flex flex-col items-center gap-[6px] md:gap-[8px] cursor-pointer group"
    >
      <div className="w-[36px] md:w-[40px] h-[36px] md:h-[40px] p-[5px] md:p-[6px] bg-white rounded-[8px] shadow-sm group-hover:shadow-md transition-all">
        <img src={src} alt={label} className="w-full h-full object-contain" />
      </div>
      <span className="font-['Bender',_sans-serif] text-[11px] md:text-[12px] leading-[1.2] text-[#1d1d1d]/60">{label}</span>
    </motion.div>
  );
}

function StatItem({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-[10px] md:gap-[12px]">
      <div className="w-[40px] md:w-[48px] h-[40px] md:h-[48px] bg-gradient-to-br from-[#783fc6]/10 to-[#8dc63f]/10 rounded-[10px] md:rounded-[12px] flex items-center justify-center">
        <Icon className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] text-[#783fc6]" />
      </div>
      <div>
        <p className="font-['Bender',_sans-serif] text-[22px] md:text-[28px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>{value}</p>
        <p className="font-['Bender',_sans-serif] text-[12px] md:text-[14px] leading-[1.2] text-[#1d1d1d]/60">{label}</p>
      </div>
    </div>
  );
}