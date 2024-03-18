import { Input } from '@stackframe/stack-ui';
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
    <div style={{ position: 'relative', display: 'flex' }}>
      <Input
        id={id}
        ref={mergeRef}
        name={name}
        type={isOpen ? 'text' : 'password'}
        autoComplete="current-password"
        required
        style={{ flex: 1 }}
        {...props}
      />
      <button
        tabIndex={-1}
        type="button"
        style={{ 
          position: 'absolute', 
          backgroundColor: 'transparent',
          border: 'none',
          top: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          paddingRight: '12px' 
        }}
        onClick={onClickReveal}
        aria-label={isOpen ? 'Mask password' : 'Reveal password'}
      >
        {isOpen ? <HiEyeOff /> : <HiEye />}
      </button>
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
