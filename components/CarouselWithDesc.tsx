import { CarouselWithDesc } from "@/types";

const CarouselWithDesc = ({
  id,
  title,
  desc,
  image,
  isInView,
}: CarouselWithDesc) => {
  const evenImgGridStyle =
    id % 2 === 0 ? `md:row-start-2 md:col-start-2 md:col-end-4` : "";
  const evenDescGridStyle =
    id % 2 === 0 ? `md:row-start-2 md:col-start-1 md:col-end-2` : "";

  return (
    <>
      <div
        className={`md:col-span-2 mt-5 carousel carousel-center 
        max-w-[1000px] p-4 space-x-4 bg-neutral rounded-box overflow-y-hidden 
        ${evenImgGridStyle}`}
        style={{
          transform: isInView ? "none" : "translateX(-200px)",
          opacity: isInView ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.17, 0.55, 0.55, 1) 0.4s",
        }}
      >
        {image.map((item, idx) => (
          <div key={idx} className="carousel-item max-w-[500px]">
            <img
              src={item}
              alt="image"
              className={`rounded-box  
                shadow-[1px_1px_8px_3px_rgb(0,0,0,0.5)]
              ${idx % 2 === 0 ? "rotate-6" : "-rotate-6"}`}
            />
          </div>
        ))}
      </div>

      <div
        className={`${evenDescGridStyle}`}
        style={{
          transform: isInView ? "none" : "translateY(-100px)",
          opacity: isInView ? 1 : 0,
          transition: "all 0.7s cubic-bezier(0.17, 0.55, 0.55, 1) 0.6s",
        }}
      >
        <h1 className="dark:text-white text-xl lg:text-2xl capitalize font-bold">
          {id}. {title}
        </h1>
        <p className="mt-2 dark:text-slate-300 text-lg">{desc}</p>
      </div>
    </>
  );
};
export default CarouselWithDesc;
