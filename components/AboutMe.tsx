import Image from "next/image";
import AboutMeTabs from "./AboutMeTabs";

const AboutMe = () => {
  return (
    <section id="about" tabIndex={-1} className="sm:mt-8">
      <div className="md:grid md:grid-cols-2 gap-8 items-center py-8 px-4 xl:gap-16">
        <Image
          src="/images/website-image.svg"
          alt="Illustration of a website on a computer"
          width={500}
          height={500}
        />

        <div className="flex flex-col h-full text-left mt-6 md:mt-0">
          <h2 className="text-primary text-2xl md:text-3xl font-bold text-center sm:text-left">
            About Me
          </h2>
          <p className="mt-3 text-left">
            I'm a QA Engineer with a background in software development and a
            passion for improving software quality.
            <br />
            <br /> Before transitioning into QA, I gained hands-on experience in
            web development, working with JavaScript, Vue.js, and Oracle
            Database.
            <br />
            <br /> Currently, I focus on software testing, navigation data
            analysis, and process automation. I also develop automation tools
            using Python and Playwright to streamline repetitive tasks and
            improve testing efficiency.
            <br />
            <br /> I'm continuously expanding my skills in test automation and
            software quality engineering, with the goal of contributing to
            international teams and building reliable, high-quality software.
          </p>
          <AboutMeTabs />
        </div>
      </div>
    </section>
  );
};
export default AboutMe;
