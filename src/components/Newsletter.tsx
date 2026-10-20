import { useState } from "react";
import { Send, Mail, User, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import imgImgMap2 from "figma:asset/7e4deb782dae559953b69d86a10007bc367c937c.png";

export function Newsletter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter signup:", { name, email });
    alert("Thank you for signing up!");
    setName("");
    setEmail("");
  };

  return (
    <section id="contact" className="relative bg-gradient-to-br from-[#8dc63f]/10 via-white to-[#783fc6]/10 py-[80px] md:py-[120px] lg:py-[140px] overflow-hidden">
      {/* Background map */}
      <div className="absolute bottom-0 left-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] opacity-[0.03] pointer-events-none">
        <img src={imgImgMap2} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-[1200px] mx-auto px-[20px] md:px-[40px] lg:px-[80px]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white p-[40px] md:p-[60px] lg:p-[80px] rounded-[32px] md:rounded-[40px] shadow-2xl border border-[#1d1d1d]/5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[48px] md:gap-[60px] lg:gap-[80px] items-center">
            {/* Left Content */}
            <div className="space-y-[24px] md:space-y-[32px]">
              <div className="flex items-center gap-[12px]">
                <Sparkles className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] text-[#783fc6]" />
                <span className="font-['Bender',_sans-serif] text-[14px] md:text-[16px] leading-[1.2] text-[#783fc6] tracking-[2px]">JOIN THE COMMUNITY</span>
              </div>
              
              <h2 className="font-['Bender',_sans-serif] text-[40px] md:text-[52px] lg:text-[56px] leading-[1.1] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
                We are building a community
              </h2>
              
              <p className="font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.6] text-[#1d1d1d]/70">
                Join countless others in this glorious purpose that is bigger than any one person. Sign up for our newsletters and events.
              </p>

              {/* Benefits */}
              <div className="space-y-[14px] md:space-y-[16px] pt-[16px] md:pt-[24px]">
                <BenefitItem text="Weekly episode updates" />
                <BenefitItem text="Exclusive behind-the-scenes content" />
                <BenefitItem text="Early access to new episodes" />
                <BenefitItem text="Community event invitations" />
              </div>
            </div>
            
            {/* Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-[20px] md:space-y-[24px]">
                <div className="relative">
                  <div className="absolute left-[18px] md:left-[20px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] text-[#1d1d1d]/40" />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-[50px] md:pl-[56px] pr-[20px] md:pr-[24px] py-[16px] md:py-[20px] bg-[#f9f9f9] border-2 border-[#1d1d1d]/10 focus:border-[#783fc6] rounded-[10px] md:rounded-[12px] font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.2] text-[#1d1d1d] placeholder:text-[#1d1d1d]/40 focus:outline-none transition-all"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute left-[18px] md:left-[20px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className="w-[18px] md:w-[20px] h-[18px] md:h-[20px] text-[#1d1d1d]/40" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-[50px] md:pl-[56px] pr-[20px] md:pr-[24px] py-[16px] md:py-[20px] bg-[#f9f9f9] border-2 border-[#1d1d1d]/10 focus:border-[#783fc6] rounded-[10px] md:rounded-[12px] font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.2] text-[#1d1d1d] placeholder:text-[#1d1d1d]/40 focus:outline-none transition-all"
                  />
                </div>
                
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#783fc6] to-[#6a35b5] hover:from-[#6a35b5] hover:to-[#783fc6] px-[28px] md:px-[32px] py-[16px] md:py-[20px] rounded-[10px] md:rounded-[12px] font-['Bender',_sans-serif] text-[16px] md:text-[18px] leading-[1.2] text-white transition-all hover:shadow-xl flex items-center justify-center gap-[10px] md:gap-[12px] group"
                  style={{ fontWeight: 700 }}
                >
                  <span>SIGN ME UP</span>
                  <Send className="w-[18px] md:w-[20px] h-[18px] md:h-[20px]" />
                </motion.button>

                <p className="font-['Bender',_sans-serif] text-[12px] md:text-[13px] leading-[1.5] text-[#1d1d1d]/50 text-center">
                  By subscribing, you agree to receive updates and newsletters. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-[10px] md:gap-[12px]"
    >
      <div className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] bg-[#8dc63f]/20 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-[12px] md:w-[14px] h-[12px] md:h-[14px] text-[#8dc63f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="font-['Bender',_sans-serif] text-[15px] md:text-[16px] leading-[1.2] text-[#1d1d1d]/80">{text}</span>
    </motion.div>
  );
}
