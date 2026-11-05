import {
  Hero,
  Navbar,
  AboutMe,
  Work,
  Hobbies,
  Contact,
  Footer,
} from "@/components";
import { Toaster } from "react-hot-toast";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <div className="container mx-auto px-10 py-4 mt-20">
        <main id="main-content" tabIndex={-1}>
          <Hero />
          <hr className="block sm:hidden border border-slate-800 my-7" />
          <AboutMe />
          <hr className="block sm:hidden border border-slate-800 my-5" />
          <Work />
          <hr className="block sm:hidden border border-slate-800 my-5" />
          <Hobbies />
          <hr className="block sm:hidden border border-slate-800 my-5" />
          <Contact />
        </main>
        <Footer />
      </div>

      <Toaster />
    </div>
  );
}
