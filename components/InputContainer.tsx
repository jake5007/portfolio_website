import type { InputContainerProps } from "@/types";

const InputContainer = ({
  label,
  name,
  type = "text",
  placeholder,
  textarea = false,
}: InputContainerProps) => {
  return (
    <div className="mb-4 w-full md:max-w-[650px]">
      <label
        htmlFor={name}
        className="mb-2 block text-slate-200 font-bold tracking-wide"
      >
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          id={name}
          placeholder={placeholder}
          rows={3}
          className="rounded-lg px-5 py-3 text-gray-800 w-full focus:outline-none"
          style={{
            padding: "0.5rem",
            border: "double 2px transparent",
            backgroundImage:
              "linear-gradient(white, white), linear-gradient(to right, orange, yellow)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
        />
      ) : (
        <input
          name={name}
          id={name}
          type={type}
          required
          placeholder={placeholder}
          className="px-5 py-3 rounded-lg text-gray-800 w-full focus:outline-none"
          style={{
            padding: "0.5rem",
            border: "double 2px transparent",
            backgroundImage:
              "linear-gradient(white, white), linear-gradient(to right, #FF6347, #FFA07A, #FFD700)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
        />
      )}
    </div>
  );
};
export default InputContainer;
