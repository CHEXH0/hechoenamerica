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

interface ContactFormEmailProps {
  name: string
  email: string
  country?: string
  subject?: string
  message: string
}

export const ContactFormEmail = ({
  name,
  email,
  country,
  subject,
  message,
}: ContactFormEmailProps) => (
  <Html>
    <Head />
    <Preview>New contact form submission from {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/assets/hechoenamerica-logo-white.png"
            alt="HechoEnAmerica Logo"
            width="80"
            height="80"
            style={logoStyle}
          />
          <Heading style={h1}>HECHO EN AMÉRICA</Heading>
          <Text style={tagline}>LA MÚSICA ES MEDICINA</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>New Contact Form Submission</Heading>
          
          <Section style={infoSection}>
            <Text style={label}>Name:</Text>
            <Text style={value}>{name}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Email:</Text>
            <Text style={value}>{email}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Country:</Text>
            <Text style={value}>{country || "Not specified"}</Text>
          </Section>
          
          <Section style={infoSection}>
            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject || "New message from HechoEnAmerica website"}</Text>
          </Section>
          
          <Hr style={lightHr} />
          
          <Section style={messageSection}>
            <Text style={label}>Message:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={footer}>
          <Text style={footerText}>
            This message was sent from the contact form on your website.
          </Text>
          <Text style={footerText}>
            Reply directly to this email to respond to {name}.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ContactFormEmail

// Styles using Treats page colors (purple-pink-red gradient theme) with improved contrast
const main = {
  backgroundColor: '#000000',
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
  padding: '40px 20px',
  background: 'linear-gradient(135deg, #4c1d95 0%, #be185d 50%, #dc2626 100%)',
  borderRadius: '16px 16px 0 0',
  marginBottom: '0',
  position: 'relative' as const,
}

const logoStyle = {
  margin: '0 auto 16px',
  display: 'block',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 12px',
  textShadow: '0 4px 8px rgba(0,0,0,0.5)',
  letterSpacing: '1.5px',
}

const tagline = {
  color: '#fde68a',
  fontSize: '16px',
  margin: '0',
  fontStyle: 'italic',
  textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  fontWeight: '400',
}

const h2 = {
  color: '#fbbf24',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
}

const content = {
  backgroundColor: '#1a1a1a',
  padding: '32px',
  borderRadius: '0 0 16px 16px',
  border: '2px solid #7c3aed',
}

const infoSection = {
  marginBottom: '20px',
}

const label = {
  color: '#fbbf24',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const value = {
  color: '#f3f4f6',
  fontSize: '16px',
  margin: '0 0 20px',
  lineHeight: '1.5',
  fontWeight: '400',
}

const messageSection = {
  marginTop: '24px',
}

const messageText = {
  color: '#f9fafb',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#374151',
  padding: '24px',
  borderRadius: '12px',
  border: '2px solid #be185d',
  borderLeft: '6px solid #fbbf24',
}

const hr = {
  borderColor: '#be185d',
  margin: '24px 0',
  borderWidth: '1px',
}

const lightHr = {
  borderColor: '#7c3aed',
  margin: '20px 0',
  borderWidth: '1px',
}

const footer = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  backgroundColor: '#111827',
  borderRadius: '0 0 16px 16px',
  borderTop: '1px solid #374151',
}

const footerText = {
  color: '#d1d5db',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '6px 0',
  fontWeight: '300',
}