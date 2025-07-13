# Node.js TypeScript Security Guide

## Purpose
This document provides comprehensive security guidelines and best practices for Node.js TypeScript applications, based on current OWASP recommendations and industry standards.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Security Principles for Node.js TypeScript Applications

#### Core Security Principles

1. **Defense in Depth**
   - Implement multiple layers of security controls
   - Never rely on a single security mechanism
   - Validate at every boundary and layer

2. **Least Privilege**
   - Run processes with minimal required permissions
   - Grant users and services only necessary access
   - Regularly audit and reduce permissions

3. **Fail Securely**
   - Ensure failures don't expose sensitive information
   - Default to secure configurations
   - Log security events without exposing sensitive data

4. **Security by Design**
   - Consider security from the beginning of development
   - Integrate security into CI/CD pipelines
   - Regular security reviews and threat modeling

### OWASP Top 10 Mitigations for Node.js

#### 1. Injection Prevention

**Input Validation:**
```typescript
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Schema validation for user input
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(18).max(120).optional()
});

// Validation middleware
export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};
```

**SQL Injection Prevention:**
```typescript
// Use parameterized queries
const getUserById = async (id: string): Promise<User | null> => {
  // Good: Parameterized query
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  // Bad: String concatenation
  // const result = await db.query(`SELECT * FROM users WHERE id = '${id}'`);
  
  return result.rows[0] || null;
};
```

**NoSQL Injection Prevention:**
```typescript
// Validate and sanitize MongoDB queries
import { ObjectId } from 'mongodb';

const findUserById = async (id: string) => {
  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid user ID format');
  }
  
  return await User.findById(new ObjectId(id));
};
```

#### 2. Broken Authentication Prevention

**Password Security:**
```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

**JWT Security:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenService {
  private static readonly SECRET = process.env.JWT_SECRET!;
  private static readonly EXPIRY = '15m';
  private static readonly REFRESH_EXPIRY = '7d';
  
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRY,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });
  }
  
  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.SECRET) as JWTPayload;
  }
}
```

#### 3. Sensitive Data Protection

**Environment Variables:**
```typescript
// .env file (never commit to version control)
// DATABASE_URL=postgresql://user:pass@localhost:5432/db
// JWT_SECRET=your-super-secret-key-here
// API_KEY=your-api-key

// Configuration with validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string().min(16),
  PORT: z.string().transform(Number).default('3000')
});

export const config = envSchema.parse(process.env);
```

**Data Encryption:**
```typescript
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 4. Access Control

**Role-Based Access Control:**
```typescript
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const payload = TokenService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.get('/admin/users', requireAuth, requireRole(['admin']), getUsersHandler);
```

#### 5. Security Misconfiguration Prevention

**HTTP Security Headers:**
```typescript
import helmet from 'helmet';
import express from 'express';

const app = express();

// Use Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Node.js Specific Security Measures

#### Package Management Security

**Package.json Security:**
```json
{
  "scripts": {
    "audit": "npm audit",
    "audit-fix": "npm audit fix",
    "security-check": "npm audit --audit-level moderate"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

**Dependency Management:**
```typescript
// Use exact versions for critical dependencies
// package.json
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "jsonwebtoken": "^9.0.0"  // Allow patch updates only
  }
}
```

#### HTTP Parameter Pollution Prevention

```typescript
import hpp from 'hpp';

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['tags'] // Allow arrays for specific parameters
}));
```

#### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 2,
  delayMs: 500
});

app.use('/api/', limiter);
app.use('/auth/', authLimiter);
app.use('/auth/login', speedLimiter);
```

### TypeScript-Specific Security Considerations

#### Type Safety for Security

```typescript
// Use branded types for sensitive data
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };

// Runtime validation that matches TypeScript types
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'moderator'])
});

type User = z.infer<typeof UserSchema>;

// Validate at runtime
const validateUser = (data: unknown): User => {
  return UserSchema.parse(data);
};
```

#### Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Security Testing and Monitoring

#### Security Testing

```typescript
// Security-focused unit tests
describe('Authentication Security', () => {
  test('should reject weak passwords', async () => {
    const weakPasswords = ['123', 'password', 'abc123'];
    
    for (const password of weakPasswords) {
      await expect(AuthService.hashPassword(password))
        .rejects.toThrow('Password must be at least 8 characters');
    }
  });
  
  test('should prevent SQL injection in user queries', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    await expect(getUserById(maliciousInput))
      .rejects.toThrow('Invalid user ID format');
  });
});
```

#### Security Monitoring

```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
export const logSecurityEvent = (event: string, details: any, req?: Request) => {
  securityLogger.warn('Security Event', {
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};

// Usage in middleware
export const securityEventLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log failed authentication attempts
  res.on('finish', () => {
    if (res.statusCode === 401) {
      logSecurityEvent('Failed Authentication', {
        path: req.path,
        method: req.method
      }, req);
    }
  });
  next();
};
```

### Security Checklist

#### Development Phase
- [ ] Input validation implemented for all user inputs
- [ ] SQL/NoSQL injection prevention measures in place
- [ ] Authentication and authorization properly implemented
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Dependencies regularly updated and audited
- [ ] TypeScript strict mode enabled
- [ ] Security tests written and passing

#### Deployment Phase
- [ ] Environment variables properly configured
- [ ] HTTPS enforced in production
- [ ] Security monitoring and logging enabled
- [ ] Regular security scans scheduled
- [ ] Incident response plan in place
- [ ] Backup and recovery procedures tested
- [ ] Access controls reviewed and documented

#### Ongoing Maintenance
- [ ] Regular dependency updates
- [ ] Security patch management
- [ ] Log monitoring and analysis
- [ ] Security training for development team
- [ ] Regular security assessments
- [ ] Threat model updates

### Tools and Resources

#### Security Tools
- **Static Analysis**: ESLint security plugins, SonarQube
- **Dependency Scanning**: npm audit, Snyk, WhiteSource
- **Runtime Protection**: Helmet.js, express-rate-limit
- **Monitoring**: Winston, Morgan, Application monitoring tools

#### Recommended Libraries
```typescript
// Essential security libraries for Node.js TypeScript projects
{
  "dependencies": {
    "helmet": "^7.0.0",           // Security headers
    "bcrypt": "^5.1.0",           // Password hashing
    "jsonwebtoken": "^9.0.0",     // JWT handling
    "express-rate-limit": "^6.0.0", // Rate limiting
    "hpp": "^0.2.3",              // HTTP Parameter Pollution
    "cors": "^2.8.5",             // CORS handling
    "joi": "^17.9.0",             // Input validation
    "zod": "^3.21.0"              // Schema validation
  },
  "devDependencies": {
    "eslint-plugin-security": "^1.7.1", // Security linting
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [cross_cutting/api_design_guide.md] - complements - API security considerations
  - [processes/validation.md] - implements - Security validation processes
  - [evolution/technical_debt_registry.md] - tracks - Security debt and updates

## Navigation Guidance
- **Access Context:** Use this document when implementing security measures or conducting security reviews
- **Common Next Steps:** After reviewing security guidelines, typically implement specific measures and update validation processes
- **Related Tasks:** Security implementation, code review, vulnerability assessment
- **Update Patterns:** This document should be updated when new security threats emerge or OWASP recommendations change

## Metadata
- **Created:** 2025-06-26
- **Last Updated:** 2025-06-26
- **Updated By:** Cline
- **Sources:** OWASP Node.js Security Cheat Sheet, OWASP Top 10, Node.js Security Best Practices

## Change History
- 2025-06-26: Initial creation based on current OWASP recommendations and Node.js security best practices
