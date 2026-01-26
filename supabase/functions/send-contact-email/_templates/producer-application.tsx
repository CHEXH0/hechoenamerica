import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ProducerApplicationEmailProps {
  name: string
  email: string
  country: string
  genres: string[]
  bio: string
  imageUrl: string
  spotifyUrl?: string
  youtubeUrl?: string
  appleMusicUrl?: string
  instagramUrl?: string
  websiteUrl?: string
}

export const ProducerApplicationEmail = ({
  name,
  email,
  country,
  genres,
  bio,
  imageUrl,
  spotifyUrl,
  youtubeUrl,
  appleMusicUrl,
  instagramUrl,
  websiteUrl,
}: ProducerApplicationEmailProps) => (
  <Html>
    <Head />
    <Preview>New Producer Application from {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>HECHO EN AMÉRICA</Heading>
          <Text style={tagline}>NEW PRODUCER APPLICATION</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>🎵 Producer Application</Heading>
          
          {imageUrl && (
            <Section style={imageSection}>
              <Img
                src={imageUrl}
                alt={`${name}'s brand image`}
                width="200"
                height="200"
                style={brandImage}
              />
            </Section>
          )}
          
          <Section style={infoSection}>
            <Text style={label}>Producer/Artist Name:</Text>
            <Text style={value}>{name}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Email:</Text>
            <Text style={value}>{email}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Location:</Text>
            <Text style={value}>{country}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Genres:</Text>
            <Text style={value}>{genres.join(', ')}</Text>
          </Section>
          
          <Hr style={lightHr} />
          
          <Section style={messageSection}>
            <Text style={label}>Bio:</Text>
            <Text style={messageText}>{bio}</Text>
          </Section>
          
          <Hr style={lightHr} />
          
          <Section style={linksSection}>
            <Text style={label}>Platform Links:</Text>
            {spotifyUrl && (
              <Text style={linkItem}>
                🎧 Spotify: <Link href={spotifyUrl} style={linkStyle}>{spotifyUrl}</Link>
              </Text>
            )}
            {youtubeUrl && (
              <Text style={linkItem}>
                📺 YouTube: <Link href={youtubeUrl} style={linkStyle}>{youtubeUrl}</Link>
              </Text>
            )}
            {appleMusicUrl && (
              <Text style={linkItem}>
                🍎 Apple Music: <Link href={appleMusicUrl} style={linkStyle}>{appleMusicUrl}</Link>
              </Text>
            )}
            {instagramUrl && (
              <Text style={linkItem}>
                📸 Instagram: <Link href={instagramUrl} style={linkStyle}>{instagramUrl}</Link>
              </Text>
            )}
            {websiteUrl && (
              <Text style={linkItem}>
                🌐 Website: <Link href={websiteUrl} style={linkStyle}>{websiteUrl}</Link>
              </Text>
            )}
          </Section>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={footer}>
          <Text style={footerText}>
            📋 Next Steps: Review this application and schedule a Google Meet call if interested.
          </Text>
          <Text style={footerText}>
            Reply directly to this email to contact {name}.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ProducerApplicationEmail

// Styles
const main = {
  backgroundColor: '#0a0a0a',
  color: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  padding: '30px 20px',
  background: 'linear-gradient(135deg, #581c87 0%, #be185d 50%, #991b1b 100%)',
  borderRadius: '12px 12px 0 0',
  marginBottom: '0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 12px',
  textShadow: '0 4px 8px rgba(0,0,0,0.4)',
  letterSpacing: '1px',
}

const tagline = {
  color: '#fbbf24',
  fontSize: '18px',
  margin: '0',
  fontWeight: '600',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  letterSpacing: '2px',
}

const h2 = {
  color: '#f472b6',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#1f1f23',
  padding: '32px',
  borderRadius: '0',
  border: '1px solid #7c3aed',
  borderTop: 'none',
}

const imageSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const brandImage = {
  borderRadius: '12px',
  border: '3px solid #be185d',
  objectFit: 'cover' as const,
}

const infoSection = {
  marginBottom: '16px',
}

const label = {
  color: '#c084fc',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const value = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.5',
  fontWeight: '400',
}

const messageSection = {
  marginTop: '24px',
}

const messageText = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#2d1b69',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #be185d',
  borderLeft: '4px solid #f472b6',
}

const linksSection = {
  marginTop: '24px',
}

const linkItem = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.5',
}

const linkStyle = {
  color: '#60a5fa',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#be185d',
  margin: '0',
}

const lightHr = {
  borderColor: '#7c3aed',
  margin: '20px 0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  backgroundColor: '#0f0f23',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #7c3aed',
  borderTop: 'none',
}

const footerText = {
  color: '#a1a1aa',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '6px 0',
  fontWeight: '300',
}
