import { Play, Clock, Calendar, Headphones } from "lucide-react";
import { motion } from "motion/react";
import imgContainerImg from "figma:asset/161d8d24bd33143a1de51bee3873c99728e0dfc1.png";
import imgImgProfile7 from "figma:asset/7949ac22e55b4a4a6c86d7bacc36ede8364f8783.png";
import imgImgProfile4 from "figma:asset/1cbd7a12730b5265576540335d9be977c1c66004.png";
import imgImgProfile5 from "figma:asset/fc4c587cbeabc13a27de43491d71361b66dfbd5e.png";
import imgImgProfile6 from "figma:asset/7d5766d0548fe131f8a921b6919660eb2a02c3ec.png";
import imgImgMap from "figma:asset/654fbbb19d54a2e3f2616b9e2cc089d0dad6552c.png";
import imgImgMap1 from "figma:asset/0da2dba8a451cff7503cbc8d25297125ecc1249a.png";

export function FeaturedEpisode() {
  return (
    <section className="max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px] py-[80px] md:py-[120px] lg:py-[140px]">
      <div className="space-y-[48px] md:space-y-[64px]">
        {/* Latest Episode */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white to-[#783fc6]/5 p-[32px] md:p-[48px] lg:p-[64px] rounded-[24px] md:rounded-[32px] border border-[#783fc6]/10 shadow-xl relative overflow-hidden"
        >
          {/* Background map decoration */}
          <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] opacity-[0.03] pointer-events-none">
            <img src={imgImgMap} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="relative flex flex-col lg:flex-row items-center gap-[40px] md:gap-[64px]">
            {/* Cover */}
            <div className="relative flex-shrink-0">
              <motion.img 
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                src={imgContainerImg} 
                alt="Latest Episode" 
                className="w-full max-w-[280px] md:w-[280px] h-auto md:h-[280px] object-cover rounded-[20px] md:rounded-[24px] shadow-2xl"
              />
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="absolute -top-[12px] -right-[12px] md:-top-[16px] md:-right-[16px] bg-[#8dc63f] text-white px-[16px] md:px-[20px] py-[6px] md:py-[8px] rounded-full shadow-lg"
              >
                <span className="font-['Bender',_sans-serif] text-[11px] md:text-[12px] leading-[1.2] tracking-[1px]" style={{ fontWeight: 700 }}>NEW</span>
              </motion.div>
            </div>
            
            {/* Details */}
            <div className="flex-1 space-y-[24px] md:space-y-[32px]">
              <div className="space-y-[12px] md:space-y-[16px]">
                <div className="flex items-center gap-[10px] md:gap-[12px]">
                  <Headphones className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] text-[#8dc63f]" />
                  <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#8dc63f] tracking-[1px]">LATEST EPISODE #S2E04</span>
                </div>
                <h3 className="font-['Bender',_sans-serif] text-[32px] md:text-[42px] lg:text-[48px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
                  The Space Economy Playbook
                </h3>
                <p className="font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.6] text-[#1d1d1d]/70 max-w-[600px]">
                  New episodes every week on <span className="text-[#783fc6] font-semibold">Monday</span>. Dive in and catch a glimpse of what we are all about.
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-[24px] md:gap-[32px]">
                <div className="flex items-center gap-[6px] md:gap-[8px]">
                  <Clock className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#1d1d1d]/50" />
                  <span className="font-['Bender',_sans-serif] text-[13px] md:text-[14px] leading-[1.2] text-[#1d1d1d]/70">45 min</span>
                </div>
                <div className="flex items-center gap-[6px] md:gap-[8px]">
                  <Calendar className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#1d1d1d]/50" />
                  <span className="font-['Bender',_sans-serif] text-[13px] md:text-[14px] leading-[1.2] text-[#1d1d1d]/70">Oct 21, 2025</span>
                </div>
              </div>

              {/* Player */}
              <div className="space-y-[16px] md:space-y-[20px]">
                <div className="bg-[#1d1d1d]/5 h-[5px] md:h-[6px] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "15%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="bg-gradient-to-r from-[#783fc6] to-[#8dc63f] h-full rounded-full" 
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-[16px] md:gap-[24px]">
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#783fc6] hover:bg-[#6a35b5] w-[56px] md:w-[64px] h-[56px] md:h-[64px] rounded-full flex items-center justify-center transition-all hover:shadow-xl group"
                  >
                    <Play className="w-[24px] md:w-[28px] h-[24px] md:h-[28px] text-white fill-white" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#8dc63f] hover:bg-[#7db531] px-[28px] md:px-[32px] py-[14px] md:py-[16px] rounded-[12px] font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.2] text-white transition-all hover:shadow-lg" 
                    style={{ fontWeight: 700 }}
                  >
                    Go to Episode
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Up Next - Full Width Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          {/* Extend to full width on larger screens */}
          <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:w-screen">
            <div className="bg-[#783fc6] p-[32px] md:p-[40px] lg:p-[48px] relative overflow-hidden">
              {/* Background patterns */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-[5%] w-[250px] md:w-[300px] h-[250px] md:h-[300px]">
                  <img src={imgImgMap1} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 left-[5%] w-[250px] md:w-[300px] h-[250px] md:h-[300px]">
                  <img src={imgImgMap} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-0 left-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-white rounded-full blur-[100px]" />
              </div>

              <div className="relative max-w-[1440px] mx-auto px-0 lg:px-[60px] flex flex-col md:flex-row items-center gap-[32px] md:gap-[40px] lg:gap-[48px]">
                <motion.img 
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  src={imgImgProfile7} 
                  alt="Host" 
                  className="w-[100px] md:w-[120px] h-[100px] md:h-[120px] object-cover rounded-full border-4 border-white/20 flex-shrink-0"
                />
                
                <div className="flex-1 space-y-[12px] md:space-y-[16px] text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-[10px] md:gap-[12px]">
                    <Calendar className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] text-[#8dc63f]" />
                    <span className="font-['Bender',_sans-serif] text-[13px] md:text-[14px] leading-[1.2] text-[#8dc63f] tracking-[1px]">UP NEXT #S2E05</span>
                  </div>
                  <h4 className="font-['Bender',_sans-serif] text-[24px] md:text-[28px] lg:text-[32px] leading-[1.3] text-white max-w-[700px]" style={{ fontWeight: 700 }}>
                    The Young Professionals Segment: The Geospatial Journey No One Prepares You For.
                  </h4>
                  <p className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#8dc63f]">
                    RELEASING ON: 26-05-2025
                  </p>
                </div>

                <div className="flex items-center gap-[16px] md:gap-[20px] flex-shrink-0">
                  <motion.img 
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    src={imgImgProfile4} 
                    alt="Guest" 
                    className="w-[64px] md:w-[80px] h-[64px] md:h-[80px] object-cover rounded-full border-4 border-white/20" 
                  />
                  <motion.img 
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    src={imgImgProfile5} 
                    alt="Guest" 
                    className="w-[64px] md:w-[80px] h-[64px] md:h-[80px] object-cover rounded-full border-4 border-white/20" 
                  />
                  <motion.img 
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    src={imgImgProfile6} 
                    alt="Guest" 
                    className="w-[64px] md:w-[80px] h-[64px] md:h-[80px] object-cover rounded-full border-4 border-white/20" 
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
