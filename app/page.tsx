import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import AboutMe from "@/components/AboutMe";
import Work from "@/components/Work";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[#f0f0f0] dark:bg-[#121212]
      "
    >
      <Navbar />
      <div className="container mx-auto px-10 py-4 mt-24">
        <Hero />
        <hr className="block sm:hidden border border-slate-800 my-7" />
        <AboutMe />
        <hr className="block sm:hidden border border-slate-800 my-5" />
        <Work />
      </div>
    </main>
  );
}
