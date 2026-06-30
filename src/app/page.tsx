import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/features/HeroSection";
import MarqueeSection from "@/components/features/MarqueeSection";
import StatsSection from "@/components/features/StatsSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import CurriculumSection from "@/components/features/CurriculumSection";
import HbcSection from "@/components/features/HbcSection";
import CTASection from "@/components/features/CTASection";
import Footer from "@/components/layout/Footer";
import VoiceGreeting from "@/components/features/VoiceGreeting";

export default function HomePage() {
  return (
    <div className="grain relative min-h-screen" style={{ background: "#07080C" }}>
      {/* mesh-bg scoped to landing page only — prevents gradient bleeding into other pages */}
      <div className="mesh-bg" aria-hidden="true" />
      <VoiceGreeting />
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
