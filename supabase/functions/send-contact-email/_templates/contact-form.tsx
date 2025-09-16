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

// Styles using brand colors
const main = {
  backgroundColor: '#0a0a0a',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  background: 'linear-gradient(135deg, #ea384c 0%, #FFD700 100%)',
  borderRadius: '8px 8px 0 0',
  marginBottom: '0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
}

const tagline = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '0',
  fontStyle: 'italic',
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
}

const h2 = {
  color: '#ea384c',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#1a1a1a',
  padding: '30px',
  borderRadius: '0 0 8px 8px',
}

const infoSection = {
  marginBottom: '16px',
}

const label = {
  color: '#FFD700',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const value = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0 0 16px',
  lineHeight: '1.4',
}

const messageSection = {
  marginTop: '20px',
}

const messageText = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#2a2a2a',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #ea384c',
}

const hr = {
  borderColor: '#ea384c',
  margin: '20px 0',
}

const lightHr = {
  borderColor: '#333333',
  margin: '16px 0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const footerText = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '4px 0',
}