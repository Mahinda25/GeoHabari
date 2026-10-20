import { useState, useEffect } from "react";
import { Calendar, Users, MapPin, ExternalLink, Clock, Filter, X, Play, Building2, Mail, CheckCircle2, Image } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { partnerships } from "../../data/partnerships";

// Mock data - replace with real data
const events = [
	{
		id: 1,
		title: "Geohabari Live: Building the Future",
		description:
			"Join us for an evening of inspiration, networking, and deep conversations about the future of African tech.",
		fullDescription:
			"An immersive evening bringing together tech innovators, entrepreneurs, and community builders to discuss the future of technology in Africa. Network with like-minded individuals, participate in panel discussions, and gain insights from industry leaders. This event features keynote speakers from top tech companies, interactive workshops, and networking sessions designed to foster collaboration and innovation.",
		date: "March 15, 2025",
		time: "6:00 PM - 9:00 PM EAT",
		location: "iHub, Nairobi",
		type: "In-Person Event",
		attendees: "150+ Expected",
		category: "Networking",
		assetType: "image" as const,
		assetUrl:
			"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
		ctaText: "Register Now",
		ctaLink: "#",
		featured: true,
		highlights: [
			"Keynote speakers from top companies",
			"Interactive panel discussions",
			"Networking sessions",
			"Light refreshments",
		],
	},
	{
		id: 2,
		title: "Virtual Tech Talk: AI in Africa",
		description:
			"Exploring the impact and opportunities of AI technologies across African markets.",
		fullDescription:
			"A deep-dive virtual session exploring artificial intelligence applications in African contexts. Learn from researchers, practitioners, and innovators who are building AI solutions for African challenges. Topics include machine learning, natural language processing, computer vision, and ethical AI deployment in diverse African markets.",
		date: "March 22, 2025",
		time: "3:00 PM - 5:00 PM EAT",
		location: "Virtual Event (Zoom)",
		type: "Virtual Event",
		attendees: "300+ Expected",
		category: "Tech Talk",
		assetType: "video" as const,
		assetUrl:
			"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
		ctaText: "Join Online",
		ctaLink: "#",
		featured: false,
		highlights: [
			"Expert presentations",
			"Live Q&A sessions",
			"Case studies from Africa",
			"Recording available",
		],
	},
	{
		id: 3,
		title: "Geohabari Workshop: Podcast Production",
		description:
			"Learn the art of podcast production from our team. Hands-on workshop covering recording, editing, and distribution.",
		fullDescription:
			"A comprehensive workshop for aspiring podcasters. Learn from the Geohabari team about equipment selection, recording techniques, audio editing workflows, and distribution strategies. Participants will get hands-on experience with professional equipment and software, plus personalized feedback on their podcast ideas.",
		date: "April 5, 2025",
		time: "10:00 AM - 4:00 PM EAT",
		location: "Nairobi Garage",
		type: "Workshop",
		attendees: "50 Participants",
		category: "Education",
		assetType: "image" as const,
		assetUrl:
			"https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop",
		ctaText: "Register Now",
		ctaLink: "#",
		featured: false,
		highlights: [
			"Hands-on training",
			"Professional equipment access",
			"Expert guidance",
			"Certificate of completion",
		],
	},
	{
		id: 4,
		title: "Community Meetup: Startup Stories",
		description:
			"Monthly gathering featuring inspiring startup journeys and lessons learned from African entrepreneurs.",
		fullDescription:
			"Join us for an intimate evening of storytelling and learning. Each month, we feature 2-3 African startup founders who share their journeys, challenges, and successes. This is followed by an open discussion and networking session. Perfect for aspiring entrepreneurs, early-stage founders, and anyone interested in the African startup ecosystem.",
		date: "March 28, 2025",
		time: "5:30 PM - 8:00 PM EAT",
		location: "The Deck, Westlands",
		type: "Community Event",
		attendees: "80+ Expected",
		category: "Networking",
		assetType: "image" as const,
		assetUrl:
			"https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
		ctaText: "RSVP Now",
		ctaLink: "#",
		featured: true,
		highlights: [
			"Founder stories",
			"Open networking",
			"Mentorship opportunities",
			"Food & beverages",
		],
	},
	{
		id: 5,
		title: "Webinar: Content Marketing for Tech",
		description:
			"Master the art of content marketing specifically for tech products and services in African markets.",
		fullDescription:
			"Learn proven strategies for creating and distributing compelling content that drives growth. This webinar covers content strategy, SEO, social media marketing, and measurement metrics tailored for tech companies operating in Africa. Features real case studies and actionable frameworks you can implement immediately.",
		date: "April 12, 2025",
		time: "2:00 PM - 3:30 PM EAT",
		location: "Online (Google Meet)",
		type: "Virtual Event",
		attendees: "200+ Expected",
		category: "Education",
		assetType: "image" as const,
		assetUrl:
			"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
		ctaText: "Register Free",
		ctaLink: "#",
		featured: false,
		highlights: [
			"Actionable frameworks",
			"Real case studies",
			"Live demonstrations",
			"Q&A with experts",
		],
	},
	{
		id: 6,
		title: "Geohabari Summit 2025",
		description:
			"Our flagship annual event bringing together 500+ tech leaders, innovators, and changemakers.",
		fullDescription:
			"The Geohabari Summit is East Africa's premier gathering for tech innovation and entrepreneurship. This two-day event features international keynote speakers, panel discussions, startup pitches, exhibition booths, and extensive networking opportunities. Past attendees include CEOs, investors, government officials, and emerging tech talent from across the continent.",
		date: "May 20-21, 2025",
		time: "9:00 AM - 6:00 PM EAT",
		location: "Kenyatta International Convention Centre",
		type: "Conference",
		attendees: "500+ Expected",
		category: "Conference",
		assetType: "image" as const,
		assetUrl:
			"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop",
		ctaText: "Get Tickets",
		ctaLink: "#",
		featured: true,
		highlights: [
			"International speakers",
			"Startup pitch competition",
			"Exhibition area",
			"VIP networking dinner",
		],
	}];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4 },
	},
};

interface EventsPartnershipsPageProps {
	onNavigate: (page: "home" | "events") => void;
}

type SelectedItem =
	| {
			type: "event";
			data: typeof events[0];
	  }
	| {
			type: "partnership";
			data: typeof partnerships[0];
	  }
	| null;

function parseEventDate(dateStr: string): Date {
	const cleaned = dateStr.replace(/(\d+)-(\d+),/, "$1,").trim();
	return new Date(cleaned);
}

export function EventsPartnershipsPage() {
	const [activeTab, setActiveTab] = useState<"events" | "partnerships">("events");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedTiming, setSelectedTiming] = useState<"all" | "upcoming" | "past">("all");
	const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
	const [dynamicEvents, setDynamicEvents] = useState<any[]>(events);

	useEffect(() => {
		fetch("/api/events")
			.then((res) => res.json())
			.then((data) => {
				if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
					const mapped = data.events.map((e: any, idx: number) => {
						const d = new Date(e.starts_at);
						const formattedDate = !isNaN(d.getTime())
							? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
							: "Coming Soon";
						const formattedTime = !isNaN(d.getTime())
							? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " EAT"
							: "";
						return {
							id: e.id || idx + 100,
							title: e.title,
							description: e.description,
							fullDescription: e.description,
							date: formattedDate,
							time: formattedTime,
							location: e.venue || "Nairobi, Kenya",
							type: "In-Person Event",
							attendees: "Open Registration",
							category: "Conference",
							assetType: "image" as const,
							assetUrl: e.poster || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
							ctaText: "Get Tickets",
							ctaLink: `/events/${e.slug}`,
							featured: true,
							highlights: [
								"Industry keynotes and technical sessions",
								"Networking with founders and geospatial leaders",
								"Ticket booking and instant registration",
							],
						};
					});
					setDynamicEvents(mapped);
				}
			})
			.catch(() => {});
	}, []);

	const categories = ["all", "Networking", "Tech Talk", "Workshop", "Education", "Conference"];

	const now = new Date();
	const filteredEvents = dynamicEvents.filter((event) => {
		const matchCategory = selectedCategory === "all" || event.category === selectedCategory;
		const eventDate = parseEventDate(event.date);
		const matchTiming =
			selectedTiming === "all" ||
			(selectedTiming === "upcoming" && eventDate >= now) ||
			(selectedTiming === "past" && eventDate < now);
		return matchCategory && matchTiming;
	});

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f9f9f9] via-white to-[#f9f9f9]">
			{/* Hero Section */}
			<section className="relative overflow-hidden h-dvh flex justify-center items-center bg-gradient-to-br from-[#783fc6]/5 via-white to-[#8dc63f]/5">
				{/* Background decorations */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1 }}
					className="absolute top-[10%] right-[5%] w-[300px] h-[300px] opacity-[0.06] pointer-events-none hidden lg:block"
				>
					<img
						src="assets/0da2dba8a451cff7503cbc8d25297125ecc1249a.png"
						alt=""
						className="w-full h-full object-cover"
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 0.2 }}
					className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] opacity-[0.06] pointer-events-none hidden lg:block"
				>
					<img
						src="assets/7e4deb782dae559953b69d86a10007bc367c937c.png"
						alt=""
						className="w-full h-full object-cover"
					/>
				</motion.div>

				{/* Content Container */}
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center max-w-[900px] mx-auto space-y-[32px]"
					>
						{/* Badge */}
						<div className="flex items-center justify-center gap-[12px]">
							<div className="w-[48px] h-[2px] bg-gradient-to-r from-transparent via-[#783fc6] to-[#783fc6]" />
							<span className=" text-[16px] leading-[1.2] text-[#783fc6] tracking-[2px]">
								EVENTS & PARTNERSHIPS
							</span>
							<div className="w-[48px] h-[2px] bg-gradient-to-l from-transparent via-[#783fc6] to-[#783fc6]" />
						</div>

						{/* Title */}
						<h1
							className=" text-[48px] md:text-[64px] lg:text-[72px] leading-[1.1] text-[#1d1d1d]"
							style={{ fontWeight: 800 }}
						>
							Connect, Collaborate, Grow
						</h1>

						{/* Description */}
						<p className=" text-[18px] md:text-[20px] leading-[1.6] text-[#1d1d1d]/70 max-w-[700px] mx-auto">
							Join our vibrant community through engaging events and discover how we're partnering with
							organizations to amplify African tech stories
						</p>

						{/* Stats */}
						{/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-[24px] md:gap-[48px] pt-[24px]"
            >
              <StatItem number="20+" label="Events Annually" />
              <StatItem number="15+" label="Active Partners" />
              <StatItem number="5,000+" label="Community Members" />
            </motion.div>*/}
					</motion.div>
				</div>
			</section>

			{/* Tabs Section */}
			<section className="relative bg-white border-y border-[#783fc6]/10">
				<div className="flex justify-center align-middle  max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-2">
					<div className="flex items-center justify-center gap-4 bg-[#f9f9f9] p-2  rounded-2xl border border-[#783fc6]/10 max-w-md mx-auto">
						<TabButton
							active={activeTab === "events"}
							onClick={() => setActiveTab("events")}
							icon={Calendar}
							label="Events"
						/>
						<TabButton
							active={activeTab === "partnerships"}
							onClick={() => setActiveTab("partnerships")}
							icon={Building2}
							label="Partnerships"
						/>
					</div>
				</div>
			</section>

			{/* Content Section */}
			<section className="relative bg-white">
				<div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-14 md:py-16">
					<AnimatePresence mode="wait">
						{activeTab === "events" ? (
							<motion.div
								key="events"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className=" flex flex-col gap-12"
							>
								{/* Timing Filter */}
								<div className="flex items-center gap-3 justify-center">
									{(["all", "upcoming", "past"] as const).map((timing) => (
										<motion.button
											key={timing}
											whileHover={{ y: -2 }}
											whileTap={{ scale: 0.98 }}
											transition={{ duration: 0.15 }}
											onClick={() => setSelectedTiming(timing)}
											className={`px-[24px] py-[12px] rounded-full text-[14px] leading-[1.2] font-semibold transition-all border ${
												selectedTiming === timing
													? "bg-gradient-to-r from-[#783fc6] to-[#6a35b5] text-white border-transparent shadow-md"
													: "bg-white text-[#1d1d1d]/60 hover:bg-[#783fc6]/5 hover:text-[#783fc6] border-[#783fc6]/15"
											}`}
										>
											{timing === "all" ? "All Events" : timing === "upcoming" ? "Upcoming" : "Past Events"}
										</motion.button>
									))}
								</div>

								{/* Category Filter */}
								<div className="flex items-center gap-3 flex-wrap justify-center">
									<div className="flex items-center gap-[8px] text-[#1d1d1d]/50">
										<Filter className="w-[18px] h-[18px]" />
										<span className=" text-[14px] leading-[1.2]">
											Filter:
										</span>
									</div>
									{categories.map((category) => (
										<motion.button
											key={category}
											whileHover={{ y: -2 }}
											whileTap={{ scale: 0.98 }}
											transition={{ duration: 0.15 }}
											onClick={() => setSelectedCategory(category)}
											className={`px-[20px] py-[10px] rounded-[10px]  text-[14px] leading-[1.2] transition-all border ${
												selectedCategory === category
													? "bg-[#783fc6] text-white border-[#783fc6]"
													: "bg-white text-[#1d1d1d]/70 hover:bg-[#783fc6]/5 hover:text-[#783fc6] border-[#783fc6]/20"
											}`}
										>
											{category.charAt(0).toUpperCase() + category.slice(1)}
										</motion.button>
									))}
								</div>

								{/* Events Grid */}
								{filteredEvents.length > 0 ? (
									<motion.div
										variants={containerVariants}
										initial="hidden"
										animate="visible"
										className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]"
									>
										{filteredEvents.map((event) => (
											<EventCardFull
												key={event.id}
												event={event}
												onClick={() => setSelectedItem({ type: "event", data: event })}
											/>
										))}
									</motion.div>
								) : (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className="text-center py-16 space-y-4"
									>
										<div className="w-16 h-16 bg-[#783fc6]/10 rounded-full flex items-center justify-center mx-auto">
											<Calendar className="w-8 h-8 text-[#783fc6]" />
										</div>
										<h3 className="text-xl font-semibold text-[#1d1d1d]">
											No {selectedTiming !== "all" ? selectedTiming : ""} events found
										</h3>
										<p className="text-[#1d1d1d]/50 max-w-md mx-auto">
											{selectedTiming === "upcoming"
												? "Stay tuned! New events are being planned."
												: "Try adjusting your filters to see more events."}
										</p>
									</motion.div>
								)}
							</motion.div>
						) : (
							<motion.div
								key="partnerships"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col gap-12 justify-center items-center"
							>
								{/* Partnerships Grid */}
								<motion.div
									variants={containerVariants}
									initial="hidden"
									animate="visible"
									className="grid grid-cols-1 md:grid-cols-2 gap-[40px]"
								>
									{partnerships.map((partnership) => (
										<PartnershipCardFull
											key={partnership.id}
											partnership={partnership}
											onClick={() => setSelectedItem({ type: "partnership", data: partnership })}
										/>
									))}
								</motion.div>

								{/* Partnership Inquiry CTA */}
								<motion.div
									variants={itemVariants}
									className="bg-gradient-to-br from-[#783fc6]/5 to-[#8dc63f]/5 rounded-4xl border border-[#783fc6]/20 p-[48px] md:p-[64px] text-center max-w-[800px] mx-auto"
								>
									<div className="space-y-[24px]">
										<div className="w-[64px] h-[64px] bg-gradient-to-br from-[#783fc6] to-[#8dc63f] rounded-full flex items-center justify-center mx-auto">
											<Mail className="w-[32px] h-[32px] text-white" />
										</div>
										<h3
											className=" text-[32px] md:text-[40px] leading-[1.2] text-[#1d1d1d]"
											style={{ fontWeight: 700 }}
										>
											Interested in partnering with us?
										</h3>
										<p className=" text-[16px] md:text-[18px] leading-[1.6] text-[#1d1d1d]/70">
											Let's collaborate to amplify African tech stories and build meaningful connections
											across the continent.
										</p>
										<motion.button
											whileHover={{ y: -2, scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											transition={{ duration: 0.15 }}
											className="flex items-center justify-center gap-[12px] bg-gradient-to-r from-[#783fc6] to-[#6a35b5] hover:from-[#6a35b5] hover:to-[#5a2ba5] px-[32px] py-[16px] rounded-[12px]  text-[18px] leading-[1.2] text-white transition-all shadow-lg hover:shadow-xl mx-auto"
											style={{ fontWeight: 700 }}
										>
											<Mail className="w-[20px] h-[20px]" />
											<span>Get in Touch</span>
										</motion.button>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</section>

			{/* Modal */}
			<Dialog open={selectedItem !== null} onOpenChange={() => setSelectedItem(null)}>
				<DialogContent className="max-w-[900px] z-[1000] max-h-[90vh] overflow-y-auto bg-white">
					{selectedItem?.type === "event" && (
						<EventModal event={selectedItem.data} onClose={() => setSelectedItem(null)} />
					)}
					{selectedItem?.type === "partnership" && (
						<PartnershipModal partnership={selectedItem.data} onClose={() => setSelectedItem(null)} />
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function StatItem({ number, label }: { number: string; label: string }) {
	return (
		<div className="space-y-[8px]">
			<div
				className=" text-[32px] md:text-[40px] leading-[1] text-[#783fc6]"
				style={{ fontWeight: 800 }}
			>
				{number}
			</div>
			<div className=" text-[14px] md:text-[16px] leading-[1.2] text-[#1d1d1d]/60">
				{label}
			</div>
		</div>
	);
}

function TabButton({
	active,
	onClick,
	icon: Icon,
	label,
}: {
	active: boolean;
	onClick: () => void;
	icon: any;
	label: string;
}) {
	return (
		<motion.button
			whileTap={{ scale: 0.98 }}
			transition={{ duration: 0.15 }}
			onClick={onClick}
			className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl  text-base leading-normal transition-all flex-1 ${
				active
					? "bg-[#783fc6] text-white shadow-md"
					: "text-[#1d1d1d]/70 hover:text-[#783fc6] hover:bg-[#783fc6]/5"
			}`}
		>
			<Icon className="w-4 h-4" />
			<span>{label}</span>
		</motion.button>
	);
}

function EventCardFull({ event, onClick }: { event: typeof events[0]; onClick: () => void }) {
	return (
		<motion.div
			variants={itemVariants}
			whileHover={{ y: -6 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
			className="bg-white rounded-2xl border border-[#783fc6]/10 overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer"
		>
			{/* Asset */}
			<div className="relative overflow-hidden">
				<div className="relative w-full h-60">
					<ImageWithFallback
						src={event.assetUrl}
						alt={event.title}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
				</div>

				{/* Badges */}
				<div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
					{event.featured && (
						<div className="bg-[#8dc63f] text-white px-3 py-1.5 rounded-full shadow-lg">
							<span className=" text-xs leading-normal font-bold">
								FEATURED
							</span>
						</div>
					)}
					<div className="bg-white/90 backdrop-blur-sm text-[#783fc6] px-3 py-1.5 rounded-full shadow-lg">
						<span className=" text-xs leading-normal font-bold">
							{event.category.toUpperCase()}
						</span>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="p-6 space-y-5">
				{/* Title and Description */}
				<div className="space-y-3">
					<h3 className=" text-[22px] leading-[1.2] text-[#1d1d1d] line-clamp-2 group-hover:text-[#783fc6] transition-colors">
						{event.title}
					</h3>
					<p className=" text-[14px] leading-[1.5] text-[#1d1d1d]/70 line-clamp-2">
						{event.description}
					</p>
				</div>

				{/* Event Details */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-[#1d1d1d]/60">
						<Calendar className="w-4 h-4 text-[#783fc6]" color="#783fc6" />
						<span className=" text-[13px] leading-[1.2]">
							{event.date}
						</span>
					</div>
					<div className="flex items-center gap-2 text-[#1d1d1d]/60">
						<Clock className="w-4 h-4 text-[#783fc6]" color="#783fc6" />
						<span className=" text-[13px] leading-[1.2]">
							{event.time}
						</span>
					</div>
					<div className="flex items-center gap-2 text-[#1d1d1d]/60">
						<MapPin className="w-4 h-4 text-[#783fc6]" color="#783fc6" />
						<span className=" text-[13px] leading-[1.2]">
							{event.location}
						</span>
					</div>
				</div>

				{/* CTA */}
				<div className="pt-[8px]">
					<div className="flex items-center gap-[8px] text-[#783fc6]  text-[15px] leading-[1.2] group-hover:gap-[12px] transition-all">
						<span>View Details</span>
						<ExternalLink className="w-[16px] h-[16px]" />
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function PartnershipCardFull({ partnership, onClick }: { partnership: typeof partnerships[0]; onClick: () => void }) {
	return (
		<motion.div
			variants={itemVariants}
			whileHover={{ y: -6 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
			className="bg-white rounded-2xl border border-[#783fc6]/10 overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer"
		>
			{/* Asset */}
			<div className="relative overflow-hidden rounded-xl">
				{partnership.assetType === "video" ? (
					<div className="relative w-full aspect-video bg-black">
						<video
							src={partnership.assetUrl}
							className="w-full h-full object-cover"
							controls
							preload="metadata"
							playsInline
						/>
					</div>
				) : (
					<div className="relative w-full aspect-video">
						<ImageWithFallback
							src={partnership.assetUrl}
							alt={partnership.title}
							className="w-full h-full object-cover"
						/>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-8 space-y-6">
				{/* Title and Description */}
				<div className="space-y-4">
					<h3 className=" text-[26px] leading-[1.2] text-[#1d1d1d] group-hover:text-[#783fc6] transition-colors">
						{partnership.title}
					</h3>
					<p className=" text-[15px] leading-[1.6] text-[#1d1d1d]/70">
						{partnership.description}
					</p>
				</div>

				{/* Partnership Details */}
				<div className="space-y-3 bg-[#f9f9f9] p-6 rounded-xl">
					<div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
						<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
							Organization
						</span>
						<span
							className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
							style={{ fontWeight: 700 }}
						>
							{partnership.organization}
						</span>
					</div>
					<div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
						<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
							Type
						</span>
						<span
							className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
							style={{ fontWeight: 700 }}
						>
							{partnership.partnershipType}
						</span>
					</div>
					<div className="flex items-center justify-between py-[12px]">
						<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
							Duration
						</span>
						<span
							className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
							style={{ fontWeight: 700 }}
						>
							{partnership.duration}
						</span>
					</div>
				</div>

				{/* CTA */}
				<div className="pt-[8px]">
					<div className="flex items-center gap-[8px] text-[#8dc63f]  text-[15px] leading-[1.2] group-hover:gap-[12px] transition-all">
						<span>View Details</span>
						<ExternalLink className="w-[16px] h-[16px]" />
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function EventModal({ event, onClose }: { event: typeof events[0]; onClose: () => void }) {
	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="space-y-[16px]">
				<div className="flex items-start justify-between gap-[16px]">
					<div className="space-y-[12px] flex-1">
						<div className="flex items-center gap-[8px] flex-wrap">
							{event.featured && (
								<div className="bg-[#8dc63f] text-white px-[12px] py-[6px] rounded-full">
									<span className=" text-[11px] leading-[1.2]" style={{ fontWeight: 700 }}>
										FEATURED
									</span>
								</div>
							)}
							<div className="bg-[#783fc6]/10 text-[#783fc6] px-[12px] py-[6px] rounded-full">
								<span className=" text-[11px] leading-[1.2]" style={{ fontWeight: 700 }}>
									{event.category.toUpperCase()}
								</span>
							</div>
						</div>
						<h2 className=" text-[28px] md:text-[32px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
							{event.title}
						</h2>
					</div>
				</div>
			</div>

			{/* Asset */}
			<div className="relative overflow-hidden rounded-[16px]">
				{event.assetType === "video" ? (
					<div className="relative w-full aspect-video bg-black">
						<video
							src={event.assetUrl}
							className="w-full h-full object-cover"
							controls
							preload="metadata"
							playsInline
						/>
					</div>
				) : (
					<div className="relative w-full aspect-video">
						<ImageWithFallback
							src={event.assetUrl}
							alt={event.title}
							className="w-full h-full object-cover"
						/>
					</div>
				)}
			</div>

			{/* Description */}
			<div className="space-y-[16px]">
				<h3 className=" text-[20px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
					About This Event
				</h3>
				<p className=" text-[15px] leading-[1.6] text-[#1d1d1d]/70">
					{event.fullDescription}
				</p>
			</div>

			{/* Event Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f9f9f9] p-6 rounded-xl">
				<DetailItemModal icon={Calendar} label="Date" value={event.date} />
				<DetailItemModal icon={Clock} label="Time" value={event.time} />
				<DetailItemModal icon={MapPin} label="Location" value={event.location} />
				<DetailItemModal icon={Users} label="Attendees" value={event.attendees} />
			</div>

			{/* Highlights */}
			<div className="space-y-[16px]">
				<h3 className=" text-[20px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
					Event Highlights
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
					{event.highlights.map((highlight, index) => (
						<div key={index} className="flex items-start gap-[10px]">
							<CheckCircle2 className="w-[20px] h-[20px] text-[#8dc63f] flex-shrink-0 mt-[2px]" />
							<span className=" text-[14px] leading-[1.5] text-[#1d1d1d]/80">
								{highlight}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* CTA */}
			<motion.a
				href={event.ctaLink}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				transition={{ duration: 0.15 }}
				className="flex items-center justify-center gap-[12px] bg-gradient-to-r from-[#783fc6] to-[#6a35b5] hover:from-[#6a35b5] hover:to-[#5a2ba5] px-[32px] py-[16px] rounded-[12px]  text-[18px] leading-[1.2] text-white transition-all shadow-lg hover:shadow-xl w-full"
				style={{ fontWeight: 700 }}
			>
				<span>{event.ctaText}</span>
				<ExternalLink className="w-[20px] h-[20px]" />
			</motion.a>
		</div>
	);
}

function PartnershipModal({ partnership, onClose }: { partnership: typeof partnerships[0]; onClose: () => void }) {
	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="space-y-[16px]">
				<div className="flex items-start justify-between gap-[16px]">
					<div className="space-y-[12px] flex-1">
						{partnership.featured && (
							<div className="bg-gradient-to-r from-[#8dc63f] to-[#7ab531] text-white px-[12px] py-[6px] rounded-full inline-block">
								<span className=" text-[11px] leading-[1.2]" style={{ fontWeight: 700 }}>
									FEATURED PARTNERSHIP
								</span>
							</div>
						)}
						<h2 className=" text-[28px] md:text-[32px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 800 }}>
							{partnership.title}
						</h2>
					</div>
				</div>
			</div>

			{/* Asset */}
			<div className="relative overflow-hidden rounded-[16px]">
				{partnership.assetType === "video" ? (
					<div className="relative w-full aspect-video bg-black">
						<video
							src={partnership.assetUrl}
							className="w-full h-full object-cover"
							controls
							preload="metadata"
							playsInline
						/>
					</div>
				) : (
					<div className="relative w-full aspect-video">
						<ImageWithFallback
							src={partnership.assetUrl}
							alt={partnership.title}
							className="w-full h-full object-cover"
						/>
					</div>
				)}
			</div>

			{/* Description */}
			<div className="space-y-[16px]">
				<h3 className=" text-[20px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
					About This Partnership
				</h3>
				<p className=" text-[15px] leading-[1.6] text-[#1d1d1d]/70">
					{partnership.fullDescription}
				</p>
			</div>

			{/* Partnership Details */}
			<div className="space-y-3 bg-[#f9f9f9] p-6 rounded-xl">
				<div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
					<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
						Organization
					</span>
					<span
						className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
						style={{ fontWeight: 700 }}
					>
						{partnership.organization}
					</span>
				</div>
				<div className="flex items-center justify-between py-[12px] border-b border-[#783fc6]/10">
					<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
						Type
					</span>
					<span
						className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
						style={{ fontWeight: 700 }}
					>
						{partnership.partnershipType}
					</span>
				</div>
				<div className="flex items-center justify-between py-[12px]">
					<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
						Duration
					</span>
					<span
						className=" text-[15px] leading-[1.2] text-[#1d1d1d]"
						style={{ fontWeight: 700 }}
					>
						{partnership.duration}
					</span>
				</div>
				<div className="flex items-center justify-between py-[12px]">
					<span className=" text-[14px] leading-[1.2] text-[#1d1d1d]/50">
						Impact
					</span>
					<span
						className=" text-[15px] leading-[1.2] text-[#783fc6]"
						style={{ fontWeight: 700 }}
					>
						{partnership.impact}
					</span>
				</div>
			</div>

			{/* Benefits */}
			<div className="space-y-[16px]">
				<h3 className=" text-[20px] leading-[1.2] text-[#1d1d1d]" style={{ fontWeight: 700 }}>
					Key Benefits
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
					{partnership.benefits.map((benefit, index) => (
						<div key={index} className="flex items-start gap-[10px]">
							<CheckCircle2 className="w-[20px] h-[20px] text-[#8dc63f] flex-shrink-0 mt-[2px]" />
							<span className=" text-[14px] leading-[1.5] text-[#1d1d1d]/80">
								{benefit}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* CTA */}
			<motion.a
				href={partnership.ctaLink}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				transition={{ duration: 0.15 }}
				className="flex items-center justify-center gap-[12px] border-2 border-[#8dc63f] hover:bg-[#8dc63f] px-[32px] py-[16px] rounded-[12px]  text-[18px] leading-[1.2] text-[#8dc63f] hover:text-white transition-all hover:shadow-lg w-full"
				style={{ fontWeight: 700 }}
			>
				<span>{partnership.ctaText}</span>
				<ExternalLink className="w-[20px] h-[20px]" />
			</motion.a>
		</div>
	);
}

function DetailItemModal({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
	return (
		<div className="flex items-start gap-3">
			<div className="w-10 h-10 bg-gradient-to-br from-[#783fc6]/10 to-[#8dc63f]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#783fc6]/10">
				<Icon className="w-5 h-5 text-[#783fc6]" />
			</div>
			<div className="flex-1">
				<p className=" text-xs leading-normal text-[#1d1d1d]/50 mb-1">
					{label}
				</p>
				<p
					className=" text-sm sm:text-base leading-normal text-[#1d1d1d] font-bold"
					style={{ fontWeight: 700 }}
				>
					{value}
				</p>
			</div>
		</div>
	);
}