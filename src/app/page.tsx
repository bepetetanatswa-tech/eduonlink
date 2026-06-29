import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/features/HeroSection";
import StatsSection from "@/components/features/StatsSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import CurriculumSection from "@/components/features/CurriculumSection";
import HbcSection from "@/components/features/HbcSection";
import CTASection from "@/components/features/CTASection";
import Footer from "@/components/layout/Footer";

const ParticleCanvas = dynamic(() => import("@/components/animations/ParticleCanvas"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-voa-navy overflow-hidden">
      {/* Global particle background */}
      <ParticleCanvas />

      {/* Navigation */}
      <Navbar />

      {/* Landing page sections */}
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CurriculumSection />
      <HbcSection />
      <CTASection />
      <Footer />
    </main>
  );
}
