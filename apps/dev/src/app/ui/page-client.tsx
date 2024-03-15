'use client';

import {
  useDesign,
  useElement
} from '@stackframe/stack-ui';
import { useCurrentUI } from 'src/components/Provider';

const text = "This is a test sentence. ";

export default function PageClient() {
  const { colors, setTheme, currentTheme } = useDesign();
  const [currentUI, setCurrentUI] = useCurrentUI();
  const { 
    Button,
    Container,
    Divider,
    Input,
    Label,
    Link,
    Text
  } = useElement();
  
  return (
    <div style={{ backgroundColor: colors.primaryBgColor }}>
      <Container size='sm'>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
          <select value={currentUI} onChange={e => setCurrentUI(e.target.value as 'default' | 'joy')}>
            <option value='default'>Default</option>
            <option value='joy'>Joy</option>
          </select>
          
          <div>
            <Button onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')} color="transparent">
              { currentTheme === 'dark' ? '☀️' : '🌙' } Toggle Theme
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='sm' color="primary">
              Button
            </Button>
            <Button size='md' color="primary">
              Button
            </Button>
            <Button size='lg' color="primary">
              Button
            </Button>
          </div>
        
          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='md' color="primary">
              Button
            </Button>
            <Button size='md' color="secondary">
              Button
            </Button>
            <Button size='md' color="transparent">
              Button
            </Button>
            <Button size='md' color="warning">
              Button
            </Button>
            <Button size='md' color="orange">
              Button
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='md' color="primary" disabled>
              Button
            </Button>
            <Button size='md' color="secondary" disabled>
              Button
            </Button>
            <Button size='md' color="transparent" disabled>
              Button
            </Button>
            <Button size='md' color="warning" disabled>
              Button
            </Button>
            <Button size='md' color="orange" disabled>
              Button
            </Button>
          </div>

          <Divider />

          <div style={{ display: 'flex', gap: 20}}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Text size='xs'>{text}</Text>
              <Text size='sm'>{text}</Text>
              <Text size='md'>{text}</Text>
              <Text size='lg'>{text}</Text>
              <Text size='xl'>{text}</Text>
            </div>
          
            <Divider direction='vertical' />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Text color="primary">{text}</Text>
              <Text color="secondary">{text}</Text>
              <Text color="warning">{text}</Text>
              <Text color="success">{text}</Text>
              <Text color="orange">{text}</Text>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
            <Link href='/test' size='xs'>link</Link>
            <Link href='/test' size='sm'>link</Link>
            <Link href='/test' size='md'>link</Link>
            <Link href='/test' size='lg'>link</Link>
            <Link href='/test' size='xl'>link</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
            <Input placeholder='text' />
            <Input type='file' />
            <Input type='password' placeholder="password" />
            <Input type='date' />
            <Input placeholder='text' disabled />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
            <form>
              <Label htmlFor="text">Text input label</Label>
              <Input id='text' placeholder='text' />
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}