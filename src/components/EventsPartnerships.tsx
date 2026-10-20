import { Calendar, Users, MapPin, ExternalLink, Play } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import imgImgMap from "figma:asset/654fbbb19d54a2e3f2616b9e2cc089d0dad6552c.png";
import imgImgMap2 from "figma:asset/7e4deb782dae559953b69d86a10007bc367c937c.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

import { useState, useEffect } from "react";

interface EventsPartnershipsProps {
  onNavigateToPage: (page: string) => void;
}

export function EventsPartnerships({ onNavigateToPage }: EventsPartnershipsProps) {
  const [eventData, setEventData] = useState({
    title: "Geohabari Live: Building the Future",
    description: "Join us for an evening of inspiration, networking, and deep conversations about the future of African tech. Meet industry leaders, share ideas, and be part of the movement.",
    date: "March 15, 2025",
    time: "6:00 PM EAT",
    location: "iHub, Nairobi",
    type: "In-Person Event",
    attendees: "150+ Expected",
    assetType: "image" as const,
    assetUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    ctaText: "Register Now",
    ctaLink: "/events"
  });

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          const first = data.events[0];
          const d = new Date(first.starts_at);
          const formattedDate = !isNaN(d.getTime())
            ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : "Upcoming";
          const formattedTime = !isNaN(d.getTime())
            ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " EAT"
            : "";
          setEventData({
            title: first.title,
            description: first.description,
            date: formattedDate,
            time: formattedTime,
            location: first.venue || "Nairobi, Kenya",
            type: "In-Person Event",
            attendees: "Open Registration",
            assetType: "image" as const,
            assetUrl: first.poster || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
            ctaText: "Get Tickets",
            ctaLink: `/events/${first.slug}`,
          });
        }
      })
      .catch(() => {});
  }, []);

  const partnership = {
    title: "Partnership with Tech Africa",
    description: "We're excited to announce our partnership with Tech Africa, amplifying tech innovation stories across the continent. Together, we're building platforms for African voices in tech.",
    organization: "Tech Africa",
    partnershipType: "Media Partnership",
    duration: "2025 - 2026",
    assetType: "image" as const, // or "video"
    assetUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop", // Replace with actual asset
    ctaText: "Learn More",
    ctaLink: "#"
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-[#f9f9f9] to-white py-[80px] md:py-[120px] lg:py-[140px] overflow-hidden">
      {/* Background decorations */}
      <motion.div 
        initial={{ opacity: 0, rotate: 10 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="absolute top-[10%] left-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] opacity-[0.04] pointer-events-none hidden lg:block"
      >
        <img src={imgImgMap} alt="" className="w-full h-full object-cover" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, rotate: -10 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-[10%] right-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] opacity-[0.04] pointer-events-none hidden lg:block"
      >
        <img src={imgImgMap2} alt="" className="w-full h-full object-cover" />
      </motion.div>

      {/* Gradient glows */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#783fc6]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-[#8dc63f]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-[20px] md:px-[40px] lg:px-[80px]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-[64px] md:space-y-[80px]"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-[900px] mx-auto space-y-[20px] md:space-y-[24px]">
            <div className="flex items-center justify-center gap-[12px] mb-[12px] md:mb-[16px]">
              <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-r from-transparent to-[#783fc6]" />
              <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#783fc6] tracking-[2px]">EVENTS & PARTNERSHIPS</span>
              <div className="w-[40px] md:w-[48px] h-[2px] bg-gradient-to-l from-transparent to-[#783fc6]" />
            </div>
            <h2 className="font-['Bender',_sans-serif] text-[40px] md:text-[52px] lg:text-[56px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
              Join us & our partners
            </h2>
            <p className="font-['Bender',_sans-serif] text-[16px] md:text-[18px] lg:text-[20px] leading-[1.6] text-[#1d1d1d]/70">
              Be part of the community through our events and collaborations
            </p>
          </motion.div>

          {/* Cards Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-[32px] md:gap-[40px]"
          >
            {/* Event Card */}
            <EventCard {...eventData} onNavigateToPage={onNavigateToPage} />

            {/* Partnership Card */}
            <PartnershipCard {...partnership} onNavigateToPage={onNavigateToPage} />
          </motion.div>

          {/* View All Button */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center pt-[24px]"
          >
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={() => onNavigateToPage("events")}
              className="flex items-center gap-[12px] bg-gradient-to-r from-[#783fc6] to-[#6a35b5] hover:from-[#6a35b5] hover:to-[#5a2ba5] px-[40px] py-[18px] rounded-[14px] font-['Bender',_sans-serif] text-[18px] leading-[1.2] text-white transition-all shadow-lg hover:shadow-xl"
              style={{ fontWeight: 700 }}
            >
              <span>View All Events & Partnerships</span>
              <ExternalLink className="w-[20px] h-[20px]" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function EventCard({ 
  title, 
  description, 
  date, 
  time, 
  location, 
  type, 
  attendees, 
  assetType, 
  assetUrl, 
  ctaText, 
  ctaLink,
  onNavigateToPage
}: {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  attendees: string;
  assetType: "image" | "video";
  assetUrl: string;
  ctaText: string;
  ctaLink: string;
  onNavigateToPage: (page: string) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[24px] md:rounded-[32px] border border-[#783fc6]/10 overflow-hidden shadow-lg hover:shadow-xl transition-all group"
    >
      {/* Asset */}
      <div className="relative overflow-hidden">
        {assetType === "video" ? (
          <div className="relative w-full aspect-video bg-black">
            <video 
              src={assetUrl} 
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
          </div>
        ) : (
          <div className="relative w-full h-[320px] md:h-[360px]">
            <ImageWithFallback 
              src={assetUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}
        
        {/* Event Badge */}
        <div className="absolute top-[20px] left-[20px] bg-gradient-to-r from-[#8dc63f] to-[#7ab531] text-white px-[16px] md:px-[20px] py-[8px] md:py-[10px] rounded-full shadow-lg backdrop-blur-sm">
          <span className="font-['Bender',_sans-serif] text-[12px] md:text-[14px] leading-[1.2]" style={{ fontWeight: 700 }}>
            UPCOMING EVENT
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-[32px] md:p-[40px] space-y-[24px] md:space-y-[32px]">
        <div className="space-y-[16px] md:space-y-[20px]">
          <h3 className="font-['Bender',_sans-serif] text-[28px] md:text-[32px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
            {title}
          </h3>
          <p className="font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.6] text-[#1d1d1d]/70">
            {description}
          </p>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <DetailItem icon={Calendar} label="Date" value={date} />
          <DetailItem icon={Calendar} label="Time" value={time} />
          <DetailItem icon={MapPin} label="Location" value={location} />
          <DetailItem icon={Users} label="Attendees" value={attendees} />
        </div>

        {/* CTA */}
        <motion.button
          onClick={onNavigateToPage}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center gap-[12px] bg-gradient-to-r from-[#783fc6] to-[#6a35b5] hover:from-[#6a35b5] hover:to-[#5a2ba5] px-[28px] md:px-[32px] py-[14px] md:py-[16px] rounded-[12px] font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.2] text-white transition-all shadow-md hover:shadow-lg group/btn w-full"
          style={{ fontWeight: 700 }}
        >
          <span>{ctaText}</span>
          <ExternalLink className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] group-hover/btn:translate-x-[2px] transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function PartnershipCard({ 
  title, 
  description, 
  organization, 
  partnershipType, 
  duration, 
  assetType, 
  assetUrl, 
  ctaText, 
  ctaLink,
  onNavigateToPage
}: {
  title: string;
  description: string;
  organization: string;
  partnershipType: string;
  duration: string;
  assetType: "image" | "video";
  assetUrl: string;
  ctaText: string;
  ctaLink: string;
  onNavigateToPage: (page: string) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[24px] md:rounded-[32px] border border-[#783fc6]/10 overflow-hidden shadow-lg hover:shadow-xl transition-all group"
    >
      {/* Asset */}
      <div className="relative overflow-hidden">
        {assetType === "video" ? (
          <div className="relative w-full aspect-video bg-black">
            <video 
              src={assetUrl} 
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
          </div>
        ) : (
          <div className="relative w-full h-[320px] md:h-[360px]">
            <ImageWithFallback 
              src={assetUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}
        
        {/* Partnership Badge */}
        <div className="absolute top-[20px] left-[20px] bg-gradient-to-r from-[#783fc6] to-[#6a35b5] text-white px-[16px] md:px-[20px] py-[8px] md:py-[10px] rounded-full shadow-lg backdrop-blur-sm">
          <span className="font-['Bender',_sans-serif] text-[12px] md:text-[14px] leading-[1.2]" style={{ fontWeight: 700 }}>
            PARTNERSHIP
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-[32px] md:p-[40px] space-y-[24px] md:space-y-[32px]">
        <div className="space-y-[16px] md:space-y-[20px]">
          <h3 className="font-['Bender',_sans-serif] text-[28px] md:text-[32px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
            {title}
          </h3>
          <p className="font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.6] text-[#1d1d1d]/70">
            {description}
          </p>
        </div>

        {/* Partnership Details */}
        <div className="space-y-[12px]">
          <div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
            <span className="font-['Bender',_sans-serif] text-[14px] leading-[1.2] text-[#1d1d1d]/50">Organization</span>
            <span className="font-['Bender',_sans-serif] text-[15px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>{organization}</span>
          </div>
          <div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
            <span className="font-['Bender',_sans-serif] text-[14px] leading-[1.2] text-[#1d1d1d]/50">Type</span>
            <span className="font-['Bender',_sans-serif] text-[15px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>{partnershipType}</span>
          </div>
          <div className="flex items-center justify-between py-[12px]">
            <span className="font-['Bender',_sans-serif] text-[14px] leading-[1.2] text-[#1d1d1d]/50">Duration</span>
            <span className="font-['Bender',_sans-serif] text-[15px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>{duration}</span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          onClick={onNavigateToPage}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center gap-[12px] border-2 border-[#8dc63f] hover:bg-[#8dc63f] px-[28px] md:px-[32px] py-[14px] md:py-[16px] rounded-[12px] font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.2] text-[#8dc63f] hover:text-white transition-all hover:shadow-lg group/btn w-full"
          style={{ fontWeight: 700 }}
        >
          <span>{ctaText}</span>
          <ExternalLink className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] group-hover/btn:translate-x-[2px] transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-[10px]">
      <div className="w-[36px] h-[36px] bg-gradient-to-br from-[#783fc6]/10 to-[#8dc63f]/10 rounded-[10px] flex items-center justify-center flex-shrink-0 border border-[#783fc6]/10">
        <Icon className="w-[18px] h-[18px] text-[#783fc6]" />
      </div>
      <div>
        <p className="font-['Bender',_sans-serif] text-[12px] leading-[1.2] text-[#1d1d1d]/50 mb-[4px]">{label}</p>
        <p className="font-['Bender',_sans-serif] text-[14px] md:text-[15px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}