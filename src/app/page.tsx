import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/features/HeroSection";
import MarqueeSection from "@/components/features/MarqueeSection";
import StatsSection from "@/components/features/StatsSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import CurriculumSection from "@/components/features/CurriculumSection";
import HbcSection from "@/components/features/HbcSection";
import CTASection from "@/components/features/CTASection";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="grain" style={{ background: "#07080C" }}>
      {/* mesh-bg scoped to landing page only */}
      <div className="mesh-bg" aria-hidden="true" />
      <Navbar />
      <HeroSection />

      {/* Sections paint above the hero's isolated WebGL stacking context */}
      <div style={{ position: "relative", zIndex: 2, background: "#07080C" }}>
        <MarqueeSection />
        <StatsSection />
        <FeaturesSection />
        <CurriculumSection />
        <HbcSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
