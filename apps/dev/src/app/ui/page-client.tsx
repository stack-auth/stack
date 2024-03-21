'use client';

import { Button, Container, Divider, Input, Label, Link, Text, useDesign } from '@stackframe/stack';
import { useCurrentUI } from 'src/components/provider';

const text = "This is a test sentence. ";

export default function PageClient() {
  const { colors, setColorMode, colorMode } = useDesign();
  const [currentUI, setCurrentUI] = useCurrentUI();
  
  return (
    <div style={{ backgroundColor: colors.primaryBgColor }}>
      <Container size='sm'>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
          <select value={currentUI} onChange={e => setCurrentUI(e.target.value as 'default' | 'joy')}>
            <option value='default'>Default</option>
            <option value='joy'>Joy</option>
          </select>
          
          <div>
            <Button onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')} variant="secondary">
              { colorMode === 'dark' ? '☀️' : '🌙' } Toggle Theme
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Button size='sm' variant="primary">
              Button
            </Button>
            <Button size='md' variant="primary">
              Button
            </Button>
            <Button size='lg' variant="primary">
              Button
            </Button>
          </div>
        
          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='md' variant="primary">
              Button
            </Button>
            <Button size='md' variant="secondary">
              Button
            </Button>
            <Button size='md' variant="warning">
              Button
            </Button>
            <Button size='md' color="orange">
              Button
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='md' variant="primary" disabled>
              Button
            </Button>
            <Button size='md' variant="secondary" disabled>
              Button
            </Button>
            <Button size='md' variant="warning" disabled>
              Button
            </Button>
            <Button size='md' color='orange' disabled>
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