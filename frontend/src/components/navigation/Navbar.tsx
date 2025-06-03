import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Header = styled(motion.header)<{ isScrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: ${({ isScrolled, theme }) =>
    isScrolled ? 'white' : 'transparent'};
  box-shadow: ${({ isScrolled, theme }) =>
    isScrolled ? theme.shadows.sm : 'none'};
  transition: ${({ theme }) => theme.transitions.default};
`;

const NavContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 1rem 2rem;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.25rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary[700]};
  text-decoration: none;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const DesktopNav = styled.nav`
  display: none;
  align-items: center;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLinkStyled = styled(NavLink)`
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
  
  &.active {
    color: ${({ theme }) => theme.colors.primary[600]};
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: ${({ theme }) => theme.colors.primary[600]};
      border-radius: 1px;
    }
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 2rem;
`;

const LoginButton = styled(Link)`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const SignUpButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
    color: white;
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  
  svg {
    margin-right: 0.5rem;
  }
`;

const UserMenuDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow: hidden;
  width: 12rem;
  z-index: 50;
`;

const UserMenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const UserMenuItem = styled.li`
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserMenuLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  text-decoration: none;
  
  svg {
    margin-right: 0.5rem;
    color: ${({ theme }) => theme.colors.neutral[500]};
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
    color: ${({ theme }) => theme.colors.primary[600]};
    
    svg {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
  }
`;

const UserMenuButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  background: none;
  border: none;
  cursor: pointer;
  
  svg {
    margin-right: 0.5rem;
    color: ${({ theme }) => theme.colors.neutral[500]};
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
    color: ${({ theme }) => theme.colors.error[600]};
    
    svg {
      color: ${({ theme }) => theme.colors.error[600]};
    }
  }
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral[700]};
  cursor: pointer;
  padding: 0.5rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const MobileMenuOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 75%;
  max-width: 20rem;
  background-color: white;
  z-index: 101;
  padding: 2rem;
  display: flex;
  flex-direction: column;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const MobileMenuCloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral[700]};
  cursor: pointer;
  padding: 0.5rem;
`;

const MobileNavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const MobileNavItem = styled.li`
  margin-bottom: 1rem;
`;

const MobileNavLink = styled(NavLink)`
  display: block;
  padding: 0.75rem 0;
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  
  &.active {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const MobileAuthButtons = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MobileLoginButton = styled(Link)`
  display: block;
  text-align: center;
  padding: 0.75rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const MobileSignUpButton = styled(Link)`
  display: block;
  text-align: center;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const MobileLogoutButton = styled.button`
  display: block;
  text-align: center;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  cursor: pointer;
`;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const userMenu = document.getElementById('user-menu');
        if (userMenu && !userMenu.contains(event.target as Node)) {
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <Header isScrolled={isScrolled}>
      <NavContainer>
        <Logo to="/">
          <Map size={24} />
          GoSmooth
        </Logo>

        <DesktopNav>
          <NavList>
            <NavItem>
              <NavLinkStyled to="/">Home</NavLinkStyled>
            </NavItem>
            <NavItem>
              <NavLinkStyled to="/places">Places</NavLinkStyled>
            </NavItem>
            <NavItem>
              <NavLinkStyled to="/route-planner">Route Planner</NavLinkStyled>
            </NavItem>
            <NavItem>
              <NavLinkStyled to="/reviews">Reviews</NavLinkStyled>
            </NavItem>
          </NavList>

          {isAuthenticated ? (
            <UserMenu id="user-menu">
              <UserButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <User size={18} />
                {user?.name}
              </UserButton>
              
              <AnimatePresence>
                {isUserMenuOpen && (
                  <UserMenuDropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserMenuList>
                      <UserMenuItem>
                        <UserMenuLink to="/profile">
                          <User size={16} />
                          Profile
                        </UserMenuLink>
                      </UserMenuItem>
                      {user?.role === 'admin' && (
                        <UserMenuItem>
                          <UserMenuLink to="/admin">
                            <User size={16} />
                            Admin Dashboard
                          </UserMenuLink>
                        </UserMenuItem>
                      )}
                      {user?.role === 'admin' && (
                        <UserMenuItem>
                          <UserMenuLink to="/admin/places">
                            <User size={16} />
                            Manage Places
                          </UserMenuLink>
                        </UserMenuItem>
                      )}
                      <UserMenuItem>
                        <UserMenuButton onClick={logout}>
                          <LogOut size={16} />
                          Logout
                        </UserMenuButton>
                      </UserMenuItem>
                    </UserMenuList>
                  </UserMenuDropdown>
                )}
              </AnimatePresence>
            </UserMenu>
          ) : (
            <AuthButtons>
              <LoginButton to="/login">Log In</LoginButton>
              <SignUpButton to="/register">Sign Up</SignUpButton>
            </AuthButtons>
          )}
        </DesktopNav>

        <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </MobileMenuButton>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <MobileMenuOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileMenu
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween' }}
              >
                <MobileMenuHeader>
                  <Logo to="/">
                    <Map size={24} />
                    GoSmooth
                  </Logo>
                  <MobileMenuCloseButton onClick={() => setIsMobileMenuOpen(false)}>
                    <X size={24} />
                  </MobileMenuCloseButton>
                </MobileMenuHeader>

                <MobileNavList>
                  <MobileNavItem>
                    <MobileNavLink to="/">Home</MobileNavLink>
                  </MobileNavItem>
                  <MobileNavItem>
                    <MobileNavLink to="/places">Places</MobileNavLink>
                  </MobileNavItem>
                  <MobileNavItem>
                    <MobileNavLink to="/route-planner">Route Planner</MobileNavLink>
                  </MobileNavItem>
                  <MobileNavItem>
                    <MobileNavLink to="/cost-estimator">Cost Estimator</MobileNavLink>
                  </MobileNavItem>
                  <MobileNavItem>
                    <MobileNavLink to="/reviews">Reviews</MobileNavLink>
                  </MobileNavItem>
                  {isAuthenticated && (
                    <>
                      <MobileNavItem>
                        <MobileNavLink to="/profile">Profile</MobileNavLink>
                      </MobileNavItem>
                      {user?.role === 'admin' && (
                        <MobileNavItem>
                          <MobileNavLink to="/admin">Admin Dashboard</MobileNavLink>
                        </MobileNavItem>
                      )}
                      {user?.role === 'admin' && (
                        <MobileNavItem>
                          <MobileNavLink to="/admin/places">
                            Manage Places
                          </MobileNavLink>
                        </MobileNavItem>
                      )}
                    </>
                  )}
                </MobileNavList>

                {isAuthenticated ? (
                  <MobileAuthButtons>
                    <MobileLogoutButton onClick={logout}>
                      Logout
                    </MobileLogoutButton>
                  </MobileAuthButtons>
                ) : (
                  <MobileAuthButtons>
                    <MobileLoginButton to="/login">Log In</MobileLoginButton>
                    <MobileSignUpButton to="/register">Sign Up</MobileSignUpButton>
                  </MobileAuthButtons>
                )}
              </MobileMenu>
            </>
          )}
        </AnimatePresence>
      </NavContainer>
    </Header>
  );
};

export default Navbar;