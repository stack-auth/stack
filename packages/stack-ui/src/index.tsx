import { createDynamicElement } from './utils/dynamic-element';
import StaticButton from './elements/button';
import StaticContainer from './elements/container';
import StaticDivider from './elements/divider';
import StaticInput from './elements/input';
import StaticLabel from './elements/label';
import StaticLink from './elements/link';
import StaticText from './elements/text';

export { useDesign } from './providers/design-provider';
export { useElements } from './providers/element-provider';
export { StackUIProvider, ThemeConfig } from './providers/ui-provider';
export { ButtonProps } from './elements/button';
export { ContainerProps } from './elements/container';
export { DividerProps } from './elements/divider';
export { InputProps } from './elements/input';
export { LabelProps } from './elements/label';
export { LinkProps } from './elements/link';
export { TextProps } from './elements/text';

export const Button = createDynamicElement<typeof StaticButton>('Button');
export const Container = createDynamicElement<typeof StaticContainer>('Container');
export const Divider = createDynamicElement<typeof StaticDivider>('Divider');
export const Input = createDynamicElement<typeof StaticInput>('Input');
export const Label = createDynamicElement<typeof StaticLabel>('Label');
export const Link = createDynamicElement<typeof StaticLink>('Link');
export const Text = createDynamicElement<typeof StaticText>('Text');