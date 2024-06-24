'use client';

import { Button, Container, Separator, Input, Label, Link, Typography, StyledLink } from '@stackframe/stack-ui';

const text = "This is a test sentence. ";

export default function PageClient() {
  
  return (
    <div>
      <Container size={600}>
        <div style={{ display: 'flex', 'flexDirection': 'column', 'gap': 20 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Button size='sm'>
              Button
            </Button>
            <Button>
              Button
            </Button>
            <Button size='lg'>
              Button
            </Button>
          </div>
        
          <div style={{ display: 'flex', gap: 5 }}>
            <Button>
              Button
            </Button>
            <Button variant="secondary">
              Button
            </Button>
            <Button variant='destructive'>
              Button
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <Button disabled>
              Button
            </Button>
            <Button variant="secondary" disabled>
              Button
            </Button>
            <Button variant="destructive" disabled>
              Button
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <Button loading>
              Button
            </Button>
            <Button variant="secondary" loading>
              Button
            </Button>
            <Button loading>
              Button
            </Button>
            <Button color='orange' loading>
              Button
            </Button>
          </div>

          <Separator />

          <div style={{ display: 'flex', gap: 20}}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Typography type='h1'>{text}</Typography>
              <Typography type='h2'>{text}</Typography>
              <Typography type='h3'>{text}</Typography>
              <Typography type='h4'>{text}</Typography>
              <Typography type='p'>{text}</Typography>
              <Typography type='label'>{text}</Typography>
              <Typography type='footnote'>{text}</Typography>
            </div>
          
            <Separator orientation='vertical' />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <Typography variant='primary'>{text}</Typography>
              <Typography variant="secondary">{text}</Typography>
              <Typography variant="destructive">{text}</Typography>
              <Typography variant="success">{text}</Typography>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
            <Link href='/test'>link</Link>
            <StyledLink href='/test'>styled link</StyledLink>
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