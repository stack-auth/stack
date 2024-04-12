import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import styled from 'styled-components';
import { useDesign } from '..';
import { SECONDARY_FONT_COLORS } from '../utils/constants';

const StyledAvatar = styled(AvatarPrimitive.Root)`
  position: relative;
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 9999px;
`;

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <StyledAvatar ref={ref} className={className} {...props} />
));
Avatar.displayName = 'Avatar';

const StyledAvatarImage = styled(AvatarPrimitive.Image)`
  aspect-ratio: 1 / 1;
  height: 100%;
  width: 100%;
`;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <StyledAvatarImage ref={ref} className={className} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

const StyledAvatarFallback = styled(AvatarPrimitive.Fallback)<{
  $backgroundColor: string,
}>`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${(p) => p.$backgroundColor};
`;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => {
  const { colors } = useDesign();
  return <StyledAvatarFallback 
    ref={ref} 
    className={className} 
    $backgroundColor={colors.secondaryColor}
    {...props} 
  />;
});
AvatarFallback.displayName = 'AvatarFallback';

type AvatarProps = React.ComponentProps<typeof Avatar>;
type AvatarImageProps = React.ComponentProps<typeof AvatarImage>;
type AvatarFallbackProps = React.ComponentProps<typeof AvatarFallback>;

export { Avatar, AvatarImage, AvatarFallback, AvatarProps, AvatarImageProps, AvatarFallbackProps };
