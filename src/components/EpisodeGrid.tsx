import { useState } from "react";
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import imgImgBanner from "figma:asset/2dfd1f6abbce08c727ac442f43fa5b25baee9b40.png";

const episodes = [
  {
    season: "02",
    episode: "09",
    title: "The Episode Title in a short form",
    duration: "42 min",
    date: "Oct 14, 2025",
    banner: imgImgBanner
  },
  {
    season: "02",
    episode: "08",
    title: "Another Amazing Episode",
    duration: "38 min",
    date: "Oct 7, 2025",
    banner: imgImgBanner
  },
  {
    season: "02",
    episode: "07",
    title: "Tech Stories from Africa",
    duration: "45 min",
    date: "Sep 30, 2025",
    banner: imgImgBanner
  },
  {
    season: "02",
    episode: "06",
    title: "Innovation and Impact",
    duration: "40 min",
    date: "Sep 23, 2025",
    banner: imgImgBanner
  },
  {
    season: "02",
    episode: "05",
    title: "Building the Future",
    duration: "43 min",
    date: "Sep 16, 2025",
    banner: imgImgBanner
  },
  {
    season: "02",
    episode: "04",
    title: "Community Spotlight",
    duration: "37 min",
    date: "Sep 9, 2025",
    banner: imgImgBanner
  }
];

export function EpisodeGrid() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);

  // Determine slides per view based on window width
  useState(() => {
    const updateSlidesPerView = () => {
      if (window.innerWidth < 640) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 1024) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(3);
      }
    };
    
    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, []);

  const maxSlide = Math.max(0, episodes.length - slidesPerView);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section id="episodes" className="max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px] py-[80px] md:py-[120px] lg:py-[140px]">
      <div className="space-y-[48px] md:space-y-[64px]">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-[24px]"
        >
          <div className="space-y-[20px] md:space-y-[24px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] md:w-[48px] h-[2px] bg-[#783fc6]" />
              <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#783fc6] tracking-[2px]">EPISODES</span>
            </div>
            <h2 className="font-['Bender',_sans-serif] text-[48px] md:text-[56px] lg:text-[64px] leading-[1.1] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
              From our archives
            </h2>
            <p className="font-['Bender',_sans-serif] text-[16px] md:text-[18px] lg:text-[20px] leading-[1.6] text-[#1d1d1d]/70 max-w-[500px]">
              Dive into our collection of conversations that inspire, educate, and entertain
            </p>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-[16px]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={prevSlide}
              className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#783fc6]/20 flex items-center justify-center hover:bg-[#783fc6] hover:text-white hover:border-[#783fc6] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-[24px] h-[24px]" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={nextSlide}
              className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#783fc6]/20 flex items-center justify-center hover:bg-[#783fc6] hover:text-white hover:border-[#783fc6] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentSlide >= maxSlide}
            >
              <ChevronRight className="w-[24px] h-[24px]" />
            </motion.button>
          </div>
        </motion.div>

        {/* Episodes Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden"
        >
          <div className="overflow-hidden px-[2px] py-[20px]">
            <motion.div
              animate={{ x: `${-currentSlide * (100 / slidesPerView)}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex"
              style={{ width: `${(episodes.length / slidesPerView) * 100}%` }}
            >
              {episodes.map((episode, index) => (
                <div 
                  key={index} 
                  className="px-[12px]"
                  style={{ width: `${100 / episodes.length}%` }}
                >
                  <EpisodeCard {...episode} />
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Dots Pagination */}
        <div className="flex items-center justify-center gap-[12px] mt-[24px]">
          {Array.from({ length: maxSlide + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-[32px] h-[12px] bg-[#783fc6]' 
                  : 'w-[12px] h-[12px] bg-[#1d1d1d]/20 hover:bg-[#783fc6]/50'
              }`}
            />
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center justify-center gap-[16px]">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={prevSlide}
            className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#783fc6]/20 flex items-center justify-center hover:bg-[#783fc6] hover:text-white hover:border-[#783fc6] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-[24px] h-[24px]" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={nextSlide}
            className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#783fc6]/20 flex items-center justify-center hover:bg-[#783fc6] hover:text-white hover:border-[#783fc6] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide >= maxSlide}
          >
            <ChevronRight className="w-[24px] h-[24px]" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}

function EpisodeCard({ season, episode, title, duration, date, banner }: { 
  season: string; 
  episode: string; 
  title: string; 
  duration: string;
  date: string;
  banner: string;
}) {
  return (
    <motion.div 
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[20px] md:rounded-[24px] border border-[#1d1d1d]/5 overflow-hidden hover:shadow-2xl transition-all group cursor-pointer h-full"
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img 
          src={banner} 
          alt={title}
          className="w-full h-[220px] md:h-[240px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-[56px] md:w-[64px] h-[56px] md:h-[64px] bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-[24px] md:w-[28px] h-[24px] md:h-[28px] text-[#783fc6] fill-[#783fc6]" />
          </div>
        </div>

        {/* Episode badge */}
        <div className="absolute top-[14px] md:top-[16px] left-[14px] md:left-[16px] bg-[#783fc6] text-white px-[10px] md:px-[12px] py-[5px] md:py-[6px] rounded-[8px]">
          <span className="font-['Bender',_sans-serif] text-[11px] md:text-[12px] leading-[1.2]" style={{ fontWeight: 700 }}>
            S{season}E{episode}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-[20px] md:p-[24px] space-y-[14px] md:space-y-[16px]">
        <h3 className="font-['Bender',_sans-serif] text-[20px] md:text-[22px] leading-[1.3] text-[#1d1d1d] line-clamp-2" style={{ fontWeight: 700 }}>
          {title}
        </h3>
        
        <div className="flex items-center gap-[14px] md:gap-[16px] text-[#1d1d1d]/60">
          <div className="flex items-center gap-[5px] md:gap-[6px]">
            <Clock className="w-[13px] md:w-[14px] h-[13px] md:h-[14px]" />
            <span className="font-['Bender',_sans-serif] text-[12px] md:text-[13px] leading-[1.2]">{duration}</span>
          </div>
          <span className="font-['Bender',_sans-serif] text-[12px] md:text-[13px] leading-[1.2]">{date}</span>
        </div>

        <button className="w-full border-2 border-[#783fc6] hover:bg-[#783fc6] px-[18px] md:px-[20px] py-[10px] md:py-[12px] rounded-[10px] font-['Bender',_sans-serif] text-[14px] md:text-[15px] leading-[1.2] text-[#783fc6] hover:text-white transition-all flex items-center justify-center gap-[8px] group/btn">
          <Play className="w-[14px] md:w-[16px] h-[14px] md:h-[16px] group-hover/btn:fill-white" />
          <span style={{ fontWeight: 700 }}>LISTEN NOW</span>
        </button>
      </div>
    </motion.div>
  );
}
