'use client';

import { FaGoogle, FaGithub, FaFacebook, FaApple, FaMicrosoft } from 'react-icons/fa';
import { useStackApp } from '..';
import { runAsynchronously } from "stack-shared/dist/utils/promises";
import Button from './Button';

const iconSize = 24;

export default function OauthButton({
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
        backgroundColor: '#4285F4',
        textColor: '#fff',
        name: 'Google',
        icon: FaGoogle
      };
      break;
    }
    case 'github': {
      style = {
        backgroundColor: '#111',
        textColor: '#fff',
        name: 'GitHub',
        icon: FaGithub
      };
      break;
    }
    case 'facebook': {
      style = {
        backgroundColor: '#1877F2',
        textColor: '#fff',
        name: 'Facebook',
        icon: FaFacebook
      };
      break;
    }
    case 'apple': {
      style = {
        backgroundColor: '#000',
        textColor: '#fff',
        name: 'Apple',
        icon: FaApple
      };
      break;
    }
    case 'microsoft': {
      style = {
        backgroundColor: '#2f2f2f',
        textColor: '#fff',
        name: 'Microsoft',
        icon: FaMicrosoft
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

  const icon = style.icon && <style.icon color={style.textColor} size={iconSize} />;

  return (
    <Button
      style={{ backgroundColor: style.backgroundColor, color: style.textColor }}
      onClick={() => runAsynchronously(stackApp.signInWithOauth(provider))}
      leftIcon={icon}
    >
      {type === 'signup' ? 'Sign up with ' : 'Sign in with '}{style.name}
    </Button>
  );
}
