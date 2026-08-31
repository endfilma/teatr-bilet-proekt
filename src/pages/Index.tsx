import CatalogProvider, { useCatalog } from '@/hooks/useCatalog';
import BookingProvider from '@/components/theatre/BookingProvider';
import Hero from '@/components/theatre/Hero';
import Afisha from '@/components/theatre/Afisha';
import Repertoire from '@/components/theatre/Repertoire';
import Tickets from '@/components/theatre/Tickets';
import Troupe from '@/components/theatre/Troupe';
import News from '@/components/theatre/News';
import Contacts from '@/components/theatre/Contacts';
import Footer from '@/components/theatre/Footer';

const Sections = () => {
  const { isVisible } = useCatalog();

  return (
    <div className="mt-6 rounded-[26px] bg-background">
      {isVisible('afisha') && <Afisha />}
      {isVisible('repertuar') && <Repertoire />}
      {isVisible('bilety') && <Tickets />}
      {isVisible('truppa') && <Troupe />}
      {isVisible('novosti') && <News />}
      {isVisible('kontakty') && <Contacts />}
    </div>
  );
};

const Index = () => (
  <CatalogProvider>
    <BookingProvider>
      <div className="min-h-screen bg-page p-3.5">
        <Hero />
        <Sections />
        <Footer />
      </div>
    </BookingProvider>
  </CatalogProvider>
);

export default Index;
