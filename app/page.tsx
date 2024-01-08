import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import AboutMe from "@/components/AboutMe";
import Image from "next/image";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[#121212]
      "
    >
      <Navbar />
      <div className="container mx-auto px-10 py-4 mt-24">
        <Hero />
        <hr className="block sm:hidden border border-slate-800 my-7" />
        <AboutMe />
      </div>
    </main>
  );
}
