import {
  Hero,
  Navbar,
  AboutMe,
  Work,
  Hobbies,
  Contact,
  Footer,
} from "@/components";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col 
      "
    >
      <Navbar />
      <div className="container mx-auto px-10 py-4 mt-20">
        <Hero />
        <hr className="block sm:hidden border border-slate-800 my-7" />
        <AboutMe />
        <hr className="block sm:hidden border border-slate-800 my-5" />
        <Work />
        <hr className="block sm:hidden border border-slate-800 my-5" />
        <Hobbies />
        <hr className="block sm:hidden border border-slate-800 my-5" />
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
