'use client';

import { Button, Container, Separator, Input, Label, Link, Text } from '@stackframe/stack';
import { useTheme } from 'next-themes';
import { useCurrentUI, useAdaptiveTheme } from 'src/components/provider';

const text = "This is a test sentence. ";

export default function PageClient() {
  
  return (
    <div>
      <Container size='sm'>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
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

          <div style={{ display: 'flex', gap: 5 }}>
            <Button size='md' variant="primary" loading>
              Button
            </Button>
            <Button size='md' variant="secondary" loading>
              Button
            </Button>
            <Button size='md' variant="warning" loading>
              Button
            </Button>
            <Button size='md' color='orange' loading>
              Button
            </Button>
          </div>

          <Separator />

          <div style={{ display: 'flex', gap: 20}}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Text size='xs'>{text}</Text>
              <Text size='sm'>{text}</Text>
              <Text size='md'>{text}</Text>
              <Text size='lg'>{text}</Text>
              <Text size='xl'>{text}</Text>
            </div>
          
            <Separator orientation='vertical' />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Text variant="primary">{text}</Text>
              <Text variant="secondary">{text}</Text>
              <Text variant="warning">{text}</Text>
              <Text variant="success">{text}</Text>
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