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
            strong interest in test automation.
            <br />
            <br />
            My experience spans web development, navigation software testing,
            and SQL-based data analysis. Having worked as both a developer and a
            tester, I bring a practical understanding of how software is built
            and how to improve its quality.
            <br />
            <br />
            I develop automation tools using Python and Playwright to streamline
            repetitive workflows and improve testing efficiency. I also build
            end-to-end test automation projects using TypeScript, Playwright,
            and GitHub Actions.
            <br />
            <br />
            I'm working toward becoming a QA Automation Engineer and hope to
            contribute to international teams that value quality,
            collaboration, and continuous improvement.
          </p>
          <AboutMeTabs />
        </div>
      </div>
    </section>
  );
};
export default AboutMe;
