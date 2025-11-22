import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import PainPoints from '@/components/landing/PainPoints';
import Transformation from '@/components/landing/Transformation';
import Mission from '@/components/landing/Mission';
import FeatureClusters from '@/components/landing/FeatureClusters';
import SocialProofSection from '@/components/landing/SocialProof';
import ProductShowcase from '@/components/landing/ProductShowcase';
import Differentiator from '@/components/landing/Differentiator';
import PricingSection from '@/components/landing/Pricing';
import CTASection from '@/components/landing/CTASection';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import ROICalculator from '@/components/landing/ROICalculator';
import LiveDemoWidget from '@/components/landing/LiveDemoWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <Hero />
      <PainPoints />
      <ROICalculator />
      <Transformation />
      <Mission />
      <FeatureClusters />
      <LiveDemoWidget />
      <SocialProofSection />
      <ProductShowcase />
      <Differentiator />
      <PricingSection />
      <CTASection />
      <FAQ />
      <Footer />
    </main>
  );
}