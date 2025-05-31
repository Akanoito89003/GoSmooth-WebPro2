import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Map, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.neutral[800]};
  color: ${({ theme }) => theme.colors.neutral[300]};
  padding: 3rem 1rem;
`;

const FooterContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: white;
  margin-bottom: 1rem;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const FooterDescription = styled.p`
  font-size: 0.9375rem;
  margin-bottom: 1.5rem;
  max-width: 24rem;
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: ${({ theme }) => theme.colors.neutral[700]};
  border-radius: 50%;
  color: white;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[600]};
    transform: translateY(-2px);
  }
`;

const FooterColumn = styled.div``;

const ColumnTitle = styled.h3`
  font-size: 1.125rem;
  color: white;
  margin-bottom: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FooterLink = styled.li`
  margin-bottom: 0.75rem;
`;

const FooterLinkAnchor = styled(Link)`
  color: ${({ theme }) => theme.colors.neutral[300]};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: white;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  svg {
    margin-right: 0.75rem;
    color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const BottomBar = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[700]};
  padding-top: 1.5rem;
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Copyright = styled.p`
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-bottom: 0;
  }
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const LegalLink = styled(Link)`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[400]};
  text-decoration: none;
  
  &:hover {
    color: white;
  }
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <FooterLogo>
            <Map size={24} />
            GoSmooth
          </FooterLogo>
          <FooterDescription>
            ทำให้การวางแผนการเดินทางราบรื่นและมีประสิทธิภาพ
            ค้นหาเส้นทางที่ดีที่สุด ประเมินค่าใช้จ่าย และอ่านบทวิจารณ์
            เพื่อให้การเดินทางของคุณราบรื่น
          </FooterDescription>
        </FooterColumn>
        
        <FooterColumn>
          <ColumnTitle>Quick Links</ColumnTitle>
          <FooterLinks>
            <FooterLink>
              <FooterLinkAnchor to="/">Home</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/route-planner">Route Planner</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/cost-estimator">Cost Estimator</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/reviews">Reviews</FooterLinkAnchor>
            </FooterLink>
          </FooterLinks>
        </FooterColumn>
        
        <FooterColumn>
          <ColumnTitle>Support</ColumnTitle>
          <FooterLinks>
            <FooterLink>
              <FooterLinkAnchor to="/help">Help Center</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/faq">FAQ</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/contact">Contact Us</FooterLinkAnchor>
            </FooterLink>
            <FooterLink>
              <FooterLinkAnchor to="/feedback">Feedback</FooterLinkAnchor>
            </FooterLink>
          </FooterLinks>
        </FooterColumn>
        
        <FooterColumn>
          <ColumnTitle>Contact</ColumnTitle>
          <ContactItem>
            <Mail size={18} />
            <span>info@gosmooth.com</span>
          </ContactItem>
          <ContactItem>
            <Phone size={18} />
            <span>+1 (555) 123-4567</span>
          </ContactItem>
        </FooterColumn>
      </FooterContent>
      
      <BottomBar>
        <Copyright>
          &copy; {currentYear} GoSmooth Travel. All rights reserved.
        </Copyright>
        <LegalLinks>
          <LegalLink to="/terms">Terms of Service</LegalLink>
          <LegalLink to="/privacy">Privacy Policy</LegalLink>
          <LegalLink to="/cookies">Cookies</LegalLink>
        </LegalLinks>
      </BottomBar>
    </FooterContainer>
  );
};

export default Footer;