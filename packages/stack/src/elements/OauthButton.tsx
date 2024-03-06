'use client';

import { FaGoogle, FaGithub, FaFacebook, FaApple, FaMicrosoft } from 'react-icons/fa';
import { useStackApp } from '..';
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import Button from './Button';

const iconSize = 24;

export default function OAuthButton({
  provider,
  type,
  redirectUrl
}: {
  provider: string,
  type: 'signin' | 'signup',
  redirectUrl?: string,
}) {
  const stackApp = useStackApp();

  let style;
  switch (provider) {
    case 'google': {
      style = {
        backgroundColor: '#fff',
        textColor: '#000',
        name: 'Google',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
        ),
      };
      break;
    }
    case 'github': {
      style = {
        backgroundColor: '#111',
        textColor: '#fff',
        name: 'GitHub',
        icon: (
          <FaGithub color="#fff" size={iconSize} />
        ),
      };
      break;
    }
    case 'facebook': {
      style = {
        backgroundColor: '#1877F2',
        textColor: '#fff',
        name: 'Facebook',
        icon: (
          <FaFacebook color="#fff" size={iconSize} />
        ),
      };
      break;
    }
    case 'apple': {
      style = {
        backgroundColor: '#000',
        textColor: '#fff',
        name: 'Apple',
        icon: (
          <FaApple color="#fff" size={iconSize} />
        ),
      };
      break;
    }
    case 'microsoft': {
      style = {
        backgroundColor: '#2f2f2f',
        textColor: '#fff',
        name: 'Microsoft',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 21 21">
            <title>{"MS-SymbolLockup"}</title>
            <path fill="#f25022" d="M1 1h9v9H1z" />
            <path fill="#00a4ef" d="M1 11h9v9H1z" />
            <path fill="#7fba00" d="M11 1h9v9h-9z" />
            <path fill="#ffb900" d="M11 11h9v9h-9z" />
          </svg>
        ),
      };
      break;
    }
    default: {
      style = {
        backgroundColor: '#000',
        textColor: '#fff',
        name: provider,
        icon: null
      };
    }
  }

  return (
    <Button
      style={{ backgroundColor: style.backgroundColor, color: style.textColor }}
      onClick={() => runAsynchronously(stackApp.signInWithOAuth(provider))}
      leftIcon={style.icon}
    >
      {type === 'signup' ? 'Sign up with ' : 'Sign in with '}{style.name}
    </Button>
  );
}
