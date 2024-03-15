'use client';

import {
  Button,
  Container,
  Divider,
  Input,
  Label,
  Link,
  Typography,
  useDesign
} from '@stackframe/stack-ui';

const text = "This is a test sentence. ";

export default function PageClient() {
  const { colors, setTheme, currentTheme } = useDesign();
  return (
    <div style={{ backgroundColor: colors.primaryBgColor }}>
      <Container size='sm'>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
          <div>
            <Button onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')} variant="primary">
              Toggle Theme
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
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
            <Button size='md' variant="plain">
              Button
            </Button>
            <Button size='md' variant="destructive">
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
            <Button size='md' variant="plain" disabled>
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
              <Typography variant="primary">{text}</Typography>
              <Typography variant="secondary">{text}</Typography>
              <Typography variant="warning">{text}</Typography>
              <Typography variant="success">{text}</Typography>
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