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
      <label htmlFor={name} className="mb-2 block font-bold tracking-wide">
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          id={name}
          placeholder={placeholder}
          rows={4}
          className="textarea textarea-bordered textarea-primary border-2 rounded-xl 
          w-full text-base-content bg-base-100 focus:outline-none text-lg resize-none"
        />
      ) : (
        <input
          name={name}
          id={name}
          type={type}
          required
          placeholder={placeholder}
          className="input input-bordered input-primary border-2 rounded-xl 
          w-full text-base-content bg-base-100 focus:outline-none text-lg"
        />
      )}
    </div>
  );
};
export default InputContainer;
