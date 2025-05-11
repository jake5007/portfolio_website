import Image from "next/image";
import AboutMeTabs from "./AboutMeTabs";

const AboutMe = () => {
  return (
    <section id="about" className="sm:mt-8">
      <div className="md:grid md:grid-cols-2 gap-8 items-center py-8 px-4 xl:gap-16">
        <Image
          src="/images/website-image.svg"
          alt="about image"
          width={500}
          height={500}
        />

        <div className="flex flex-col h-full text-left mt-6 md:mt-0">
          <h1 className="text-primary text-2xl md:text-3xl font-bold text-center sm:text-left">
            About Me
          </h1>
          <p className="mt-3 text-center sm:text-left">
            I am a web developer with a passion for diving into new challenges.
            I have working experience with HTML, CSS, JavaScript, Vue and Oracle
            DB. However, I&apos;ve pursued learning React, Redux, Node/Express,
            Next.js, PostgreSQL, MongoDB, etc on my own. I am a quick learner
            and a team player, looking for an opportunity to expand my knowledge
            and contribute to collaborative projects.
          </p>
          <AboutMeTabs />
        </div>
      </div>
    </section>
  );
};
export default AboutMe;
