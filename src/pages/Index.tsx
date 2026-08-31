import CatalogProvider from '@/hooks/useCatalog';
import BookingProvider from '@/components/theatre/BookingProvider';
import Hero from '@/components/theatre/Hero';
import Afisha from '@/components/theatre/Afisha';
import Repertoire from '@/components/theatre/Repertoire';
import Tickets from '@/components/theatre/Tickets';
import Troupe from '@/components/theatre/Troupe';
import News from '@/components/theatre/News';
import Contacts from '@/components/theatre/Contacts';
import Footer from '@/components/theatre/Footer';

const Index = () => (
  <CatalogProvider>
    <BookingProvider>
      <div className="min-h-screen bg-page p-3.5">
        <Hero />
        <div className="mt-6 rounded-[26px] bg-background">
          <Afisha />
          <Repertoire />
          <Tickets />
          <Troupe />
          <News />
          <Contacts />
        </div>
        <Footer />
      </div>
    </BookingProvider>
  </CatalogProvider>
);

export default Index;