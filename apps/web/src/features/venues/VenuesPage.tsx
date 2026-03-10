import Hero from '../../components/landing/Hero'
import HowItWorks from '../../components/landing/HowItWorks'
import WhyChoose from '../../components/landing/WhyChoose'
import Pricing from '../../components/landing/Pricing'
import FinalCTA from '../../components/landing/FinalCTA'
import Footer from '../../components/ui/Footer'

export function VenuePage() {
  return (
    <>
      <main>
        <Hero />
        <HowItWorks />
        <WhyChoose />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

