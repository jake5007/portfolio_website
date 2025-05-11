import type { TabBtnProps } from "@/types";

const TabBtn = ({
  active,
  onTabChange,
  customTextClasses,
  children,
}: TabBtnProps) => {
  // const textStyles = active
  //   ? "underline underline-offset-4 decoration-2"
  //   : "text-base-content/70";

  return (
    <button onClick={onTabChange}>
      <p
        className={`relative inline-block font-semibold hover:opacity-80 transition-opacity duration-200 ${customTextClasses} ${
          !active && "text-base-content/80"
        }`}
      >
        {children}
        <span
          className={`absolute bottom-0 left-0 h-[2px] w-full bg-current transform transition-transform duration-300 ease-in-out origin-left ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </p>
    </button>
  );
};
export default TabBtn;
