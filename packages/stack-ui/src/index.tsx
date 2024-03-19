import { createDynamicComponent } from './utils/dynamic-component';
import StaticButton from './components/button';
import StaticContainer from './components/container';
import StaticDivider from './components/divider';
import StaticInput from './components/input';
import StaticLabel from './components/label';
import StaticLink from './components/link';
import StaticText from './components/text';

export { useDesign } from './providers/design-provider';
export { useComponents } from './providers/component-provider';
export { StackUIProvider, ThemeConfig } from './providers/ui-provider';
export { ButtonProps } from './components/button';
export { ContainerProps } from './components/container';
export { DividerProps } from './components/divider';
export { InputProps } from './components/input';
export { LabelProps } from './components/label';
export { LinkProps } from './components/link';
export { TextProps } from './components/text';

export const Button = createDynamicComponent<typeof StaticButton>('Button');
export const Container = createDynamicComponent<typeof StaticContainer>('Container');
export const Divider = createDynamicComponent<typeof StaticDivider>('Divider');
export const Input = createDynamicComponent<typeof StaticInput>('Input');
export const Label = createDynamicComponent<typeof StaticLabel>('Label');
export const Link = createDynamicComponent<typeof StaticLink>('Link');
export const Text = createDynamicComponent<typeof StaticText>('Text');