import type { TabBtnProps } from "@/types";

const TabBtn = ({
  active,
  onTabChange,
  customTextClasses,
  children,
}: TabBtnProps) => {
  const textStyles = active
    ? "text-white underline underline-offset-4 decoration-2"
    : "text-[#a4a8aa]";

  return (
    <button onClick={onTabChange}>
      <p
        className={`mr-3 font-semibold ${customTextClasses} ${textStyles} hover:text-white`}
      >
        {children}
      </p>
    </button>
  );
};
export default TabBtn;
