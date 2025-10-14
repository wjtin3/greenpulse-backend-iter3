# GreenPulse Security Plan

## Executive Summary

This security plan addresses the comprehensive security requirements for the GreenPulse carbon footprint calculator application, covering both backend (Node.js/Express/PostgreSQL) and frontend (Vue.js/Vite) components. The plan identifies security risks, implements protective measures, and establishes incident response procedures.

## System Security Awareness

### Foundational Security Practices

The GreenPulse application implements the following foundational security practices:

1. **Environment Variable Management**: All sensitive data stored in environment variables
2. **Input Validation**: Comprehensive validation for all API inputs
3. **SQL Injection Protection**: Parameterized queries throughout
4. **Rate Limiting**: Built-in rate limiting for API endpoints
5. **Error Handling**: Secure error messages without data exposure
6. **CORS Configuration**: Proper cross-origin resource sharing setup

### Authorization Controls

| Risk | Risk Description | Risk Rating | Recommendation |
|------|------------------|-------------|----------------|
| 1 | Broken Authentication | **HIGH** | **Current Status**: No user authentication system implemented<br/>**Recommendation**: Implement JWT-based authentication with:<br/>- Strong password policy (minimum 9 characters, alphanumeric + special characters)<br/>- Password complexity requirements<br/>- Account lockout after 5 failed attempts<br/>- Session timeout after 30 minutes of inactivity<br/>- Multi-factor authentication for admin accounts |
| 2 | Open Ports and Services | **LOW** | **Current Status**: CORS allows all origins (`origin: true`)<br/>**Recommendation**: Restrict CORS to specific domains:<br/>- Production: `https://greenpulse-frontend-v.vercel.app`<br/>- Development: `http://localhost:5173`<br/>- Close unnecessary ports and services |

## Risk Analysis

### High-Risk Vulnerabilities

#### 1. **No Authentication System**
- **Risk**: Unauthorized access to all API endpoints
- **Impact**: Data manipulation, service abuse, potential data breaches
- **Likelihood**: High (public APIs)
- **Mitigation**: Implement JWT-based authentication with role-based access control

#### 2. **Overly Permissive CORS Configuration**
- **Risk**: Cross-origin attacks, data theft
- **Impact**: Medium (limited by API design)
- **Likelihood**: Medium
- **Mitigation**: Restrict CORS to specific trusted domains

#### 3. **API Key Exposure in Frontend**
- **Risk**: Google Maps API key exposed in client-side code
- **Impact**: High (potential service abuse, billing issues)
- **Likelihood**: High
- **Mitigation**: Implement server-side proxy for Google Maps API calls

#### 4. **Insufficient Input Validation**
- **Risk**: Injection attacks, data corruption
- **Impact**: Medium
- **Likelihood**: Medium
- **Mitigation**: Enhanced input validation and sanitization

### Medium-Risk Vulnerabilities

#### 5. **Database Connection Security**
- **Risk**: Database credentials in environment variables
- **Impact**: High (if compromised)
- **Likelihood**: Low (properly managed)
- **Mitigation**: Use connection pooling, SSL/TLS encryption

#### 6. **Rate Limiting Bypass**
- **Risk**: API abuse, DoS attacks
- **Impact**: Medium
- **Likelihood**: Medium
- **Mitigation**: Implement IP-based rate limiting with Redis caching

#### 7. **Error Information Disclosure**
- **Risk**: Sensitive information in error messages
- **Impact**: Low
- **Likelihood**: Low
- **Mitigation**: Generic error messages in production

### Low-Risk Vulnerabilities

#### 8. **Dependency Vulnerabilities**
- **Risk**: Known vulnerabilities in npm packages
- **Impact**: Variable
- **Likelihood**: Low
- **Mitigation**: Regular dependency updates and security audits

## Security Measures and Policies

### 1. Authentication and Authorization

#### Password Policy
- **Minimum Length**: 9 characters
- **Complexity**: Must include uppercase, lowercase, numbers, and special characters
- **History**: Prevent reuse of last 5 passwords
- **Expiration**: 90 days for admin accounts, 180 days for regular users
- **Lockout**: 5 failed attempts lock account for 15 minutes

#### Session Management
- **Session Timeout**: 30 minutes of inactivity
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **Token Rotation**: Refresh tokens every 15 minutes

### 2. API Security

#### Input Validation
```javascript
// Enhanced validation example
const validateInput = (data, schema) => {
  const errors = [];
  // Type checking
  // Length validation
  // Pattern matching
  // SQL injection prevention
  return errors;
};
```

#### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Calculation Endpoints**: 20 requests per 15 minutes per IP
- **Recommendation Endpoints**: 10 requests per 15 minutes per IP

### 3. Database Security

#### Connection Security
- **SSL/TLS**: All database connections encrypted
- **Connection Pooling**: Limited to 3 concurrent connections in production
- **Query Timeout**: 15 seconds maximum
- **Parameterized Queries**: All queries use prepared statements

#### Data Protection
- **Encryption at Rest**: Database-level encryption
- **Backup Encryption**: All backups encrypted
- **Access Logging**: All database access logged

### 4. Frontend Security

#### Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://maps.googleapis.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://gp-backend-iter3.vercel.app;">
```

#### API Key Protection
- **Server-Side Proxy**: All external API calls routed through backend
- **Environment Variables**: No API keys in client-side code
- **Domain Restrictions**: API keys restricted to specific domains

### 5. Network Security

#### CORS Configuration
```javascript
// Production CORS
const corsOptions = {
  origin: [
    'https://greenpulse-frontend-v.vercel.app',
    'https://greenpulse-frontend-iteration3.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

#### HTTPS Enforcement
- **Force HTTPS**: All traffic redirected to HTTPS
- **HSTS Headers**: Strict Transport Security enabled
- **Certificate Management**: Automated certificate renewal

## Ethical, Legal, Security and Privacy Issues

### User Data Protection

#### Data Collection
- **Minimal Data**: Only collect necessary data for carbon calculations
- **No Personal Identifiers**: No names, emails, or personal information stored
- **Session Data**: Temporary session data for calculation context
- **Analytics**: Anonymous usage statistics only

#### Data Processing
- **Purpose Limitation**: Data used only for carbon footprint calculations
- **Data Minimization**: Only process data necessary for service functionality
- **Retention**: Session data deleted after 24 hours
- **Anonymization**: All stored data anonymized

#### Privacy Compliance
- **GDPR Compliance**: Right to deletion, data portability
- **Malaysian PDPA**: Compliance with Personal Data Protection Act
- **Transparency**: Clear privacy policy and data usage disclosure
- **Consent**: Explicit consent for data processing

### Security Measures

#### Threat Prevention
- **Input Sanitization**: All user inputs sanitized
- **Output Encoding**: All outputs properly encoded
- **XSS Protection**: Content Security Policy implemented
- **CSRF Protection**: CSRF tokens for state-changing operations

#### Data Encryption
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: Database encryption enabled
- **Key Management**: Secure key rotation procedures

## Incident Response and Root Cause Analysis

### Incident Classification

#### Severity Levels
1. **Critical**: Data breach, system compromise
2. **High**: Service disruption, unauthorized access
3. **Medium**: Performance issues, minor security events
4. **Low**: Informational events, minor issues

### Response Procedures

#### Immediate Response (0-1 hour)
1. **Assess Impact**: Determine scope and severity
2. **Contain Threat**: Isolate affected systems
3. **Notify Stakeholders**: Alert development team
4. **Document Evidence**: Preserve logs and evidence

#### Short-term Response (1-24 hours)
1. **Investigate**: Detailed analysis of incident
2. **Implement Fixes**: Deploy security patches
3. **Monitor**: Continuous monitoring for related attacks
4. **Communicate**: Update stakeholders on progress

#### Long-term Response (1-7 days)
1. **Root Cause Analysis**: Identify underlying causes
2. **Process Improvement**: Update security procedures
3. **Training**: Security awareness training
4. **Documentation**: Update incident response procedures

### Root Cause Analysis Process

#### Investigation Steps
1. **Timeline Reconstruction**: Create detailed timeline of events
2. **System Analysis**: Examine affected systems and configurations
3. **Log Analysis**: Review all relevant logs and monitoring data
4. **Vulnerability Assessment**: Identify security gaps

#### Documentation Requirements
- **Incident Report**: Detailed description of events
- **Impact Assessment**: Business and technical impact
- **Remediation Actions**: Steps taken to resolve incident
- **Prevention Measures**: Actions to prevent recurrence

### Monitoring and Detection

#### Security Monitoring
- **API Monitoring**: Track unusual API usage patterns
- **Database Monitoring**: Monitor database access and queries
- **Network Monitoring**: Track network traffic and connections
- **Error Monitoring**: Monitor application errors and exceptions

#### Alerting System
- **Real-time Alerts**: Immediate notification of security events
- **Threshold Monitoring**: Automated alerts for unusual activity
- **Escalation Procedures**: Clear escalation paths for different severity levels

## Implementation Timeline

### Phase 1: Immediate (Week 1-2)
- [ ] Implement JWT authentication system
- [ ] Restrict CORS configuration
- [ ] Add input validation middleware
- [ ] Implement rate limiting with Redis

### Phase 2: Short-term (Week 3-4)
- [ ] Add Content Security Policy
- [ ] Implement API key protection
- [ ] Set up security monitoring
- [ ] Create incident response procedures

### Phase 3: Long-term (Month 2-3)
- [ ] Security audit and penetration testing
- [ ] Implement advanced threat detection
- [ ] Create security training program
- [ ] Establish compliance monitoring

## Conclusion

This security plan provides a comprehensive framework for securing the GreenPulse application. The identified risks require immediate attention, particularly the lack of authentication and overly permissive CORS configuration. Implementation of these security measures will significantly reduce the application's attack surface and protect user data.

Regular security reviews and updates to this plan are essential to maintain effective security posture as the application evolves.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025  
**Approved By**: Development Team  
**Classification**: Internal Use
