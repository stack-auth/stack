import { forwardRef, useRef, useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export const PasswordField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ id, name, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mergeRef = (node: HTMLInputElement) => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
    inputRef.current = node;
  };

  const onClickReveal = () => {
    setIsOpen(!isOpen);
    const currentInput = inputRef.current;
    if (currentInput) {
      currentInput.focus({ preventScroll: true });
    }
  };

  return (
    <div className="wl_relative">
      <input
        id={id}
        ref={mergeRef}
        name={name}
        type={isOpen ? 'text' : 'password'}
        autoComplete="current-password"
        required
        className="wl_input wl_input-bordered wl_w-full"
        {...props}
      />
      <button
        type="button"
        className="wl_absolute wl_inset-y-0 wl_right-0 wl_flex wl_items-center wl_pr-3"
        onClick={onClickReveal}
        aria-label={isOpen ? 'Mask password' : 'Reveal password'}
      >
        {isOpen ? <HiEyeOff /> : <HiEye />}
      </button>
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
