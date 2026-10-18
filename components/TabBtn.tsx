import type { TabBtnProps } from "@/types";

const TabBtn = ({
  active,
  onTabChange,
  customTextClasses,
  children,
}: TabBtnProps) => {
  return (
    <button type="button" aria-pressed={active} onClick={onTabChange}>
      <span
        className={`relative inline-block font-semibold sm:hover:underline ${customTextClasses ?? ""} ${
          active ? "" : "text-base-content/80"
        }`}
      >
        {children}
        <span
          className={`absolute bottom-0 left-0 h-[2px] w-full bg-current transform transition-transform duration-300 ease-in-out origin-left ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </span>
    </button>
  );
};
export default TabBtn;
