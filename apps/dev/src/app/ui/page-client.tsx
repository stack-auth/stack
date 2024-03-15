'use client';

import {
  Container,
  Divider,
  Input,
  Label,
  Link,
  Typography,
  useDesign,
  useElement
} from '@stackframe/stack-ui';

const text = "This is a test sentence. ";

export default function PageClient() {
  const { colors, setTheme, currentTheme } = useDesign();
  const { Button } = useElement();
  return (
    <div style={{ backgroundColor: colors.primaryBgColor }}>
      <Container size='sm'>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
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
              <Typography size='xs'>{text}</Typography>
              <Typography size='sm'>{text}</Typography>
              <Typography size='md'>{text}</Typography>
              <Typography size='lg'>{text}</Typography>
              <Typography size='xl'>{text}</Typography>
            </div>
          
            <Divider direction='vertical' />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Typography color="primary">{text}</Typography>
              <Typography color="secondary">{text}</Typography>
              <Typography color="warning">{text}</Typography>
              <Typography color="success">{text}</Typography>
              <Typography color="orange">{text}</Typography>
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