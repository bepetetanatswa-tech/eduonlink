import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/features/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import CurriculumSection from "@/components/features/CurriculumSection";
import HbcSection from "@/components/features/HbcSection";
import CTASection from "@/components/features/CTASection";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="bg-edu-paper margin-rule">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CurriculumSection />
      <HbcSection />
      <CTASection />
      <Footer />
    </div>
  );
}
