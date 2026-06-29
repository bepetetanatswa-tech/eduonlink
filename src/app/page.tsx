import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/features/HeroSection";
import MarqueeSection from "@/components/features/MarqueeSection";
import StatsSection from "@/components/features/StatsSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import CurriculumSection from "@/components/features/CurriculumSection";
import HbcSection from "@/components/features/HbcSection";
import CTASection from "@/components/features/CTASection";
import Footer from "@/components/layout/Footer";

// AiSection (Sir Taks tutor demo) lives inside the authenticated app — not on the public landing page

export default function HomePage() {
  return (
    <div className="relative min-h-screen" style={{ background: "#07080C" }}>
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <FeaturesSection />
      <CurriculumSection />
      <HbcSection />
      <CTASection />
      <Footer />
    </div>
  );
}
