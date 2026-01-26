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
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ProducerApplicationConfirmationProps {
  name: string
}

export const ProducerApplicationConfirmation = ({
  name,
}: ProducerApplicationConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Your Producer Application Has Been Received - Hecho En América</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>HECHO EN AMÉRICA</Heading>
          <Text style={tagline}>LA MÚSICA ES MEDICINA</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Application Received! 🎉</Heading>
          
          <Text style={greeting}>Hey {name},</Text>
          
          <Text style={paragraph}>
            Thank you for applying to join the <strong>Hecho En América</strong> producer network! 
            We're excited to review your application and learn more about your work.
          </Text>
          
          <Section style={stepsSection}>
            <Text style={stepsTitle}>📋 What Happens Next:</Text>
            
            <Text style={stepItem}>
              <strong>1. Application Review</strong><br />
              Our team will carefully review your profile, music, and platform links.
            </Text>
            
            <Text style={stepItem}>
              <strong>2. Google Meet Interview</strong><br />
              If your application stands out, we'll reach out to schedule a video call to discuss the opportunity further.
            </Text>
            
            <Text style={stepItem}>
              <strong>3. Onboarding & Discord Access</strong><br />
              Approved producers will be onboarded to our platform and given access to our <strong>Discord server</strong>, where you'll receive and accept projects from artists.
            </Text>
          </Section>
          
          <Hr style={lightHr} />
          
          <Section style={discordSection}>
            <Text style={discordTitle}>💬 About Discord</Text>
            <Text style={paragraph}>
              Once approved, you'll use <strong>Discord</strong> to:
            </Text>
            <Text style={bulletItem}>• Receive notifications for new project opportunities</Text>
            <Text style={bulletItem}>• Accept or decline projects that match your expertise</Text>
            <Text style={bulletItem}>• Communicate with the team and other producers</Text>
            <Text style={bulletItem}>• Get support and updates from Hecho En América</Text>
          </Section>
          
          <Hr style={lightHr} />
          
          <Text style={paragraph}>
            We typically respond within <strong>3-5 business days</strong>. Keep an eye on your inbox!
          </Text>
          
          <Text style={paragraph}>
            If you have any questions in the meantime, feel free to reply to this email.
          </Text>
          
          <Text style={signature}>
            Best regards,<br />
            <strong>The Hecho En América Team</strong>
          </Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Hecho En América. All rights reserved.
          </Text>
          <Text style={footerText}>
            La Música Es Medicina 🎵
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ProducerApplicationConfirmation

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
  color: '#e879f9',
  fontSize: '16px',
  margin: '0',
  fontStyle: 'italic',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  fontWeight: '300',
}

const h2 = {
  color: '#4ade80',
  fontSize: '28px',
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

const greeting = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '500',
  margin: '0 0 20px',
}

const paragraph = {
  color: '#d1d5db',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const stepsSection = {
  backgroundColor: '#2d1b69',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid #be185d',
  margin: '24px 0',
}

const stepsTitle = {
  color: '#f472b6',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const stepItem = {
  color: '#ffffff',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '12px 0',
  paddingLeft: '8px',
  borderLeft: '3px solid #7c3aed',
}

const discordSection = {
  backgroundColor: '#1a1a2e',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #5865F2',
  margin: '20px 0',
}

const discordTitle = {
  color: '#5865F2',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const bulletItem = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '4px 0',
}

const signature = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '1.7',
  marginTop: '24px',
}

const hr = {
  borderColor: '#be185d',
  margin: '0',
}

const lightHr = {
  borderColor: '#7c3aed',
  margin: '24px 0',
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
