# Node-TypeScript API Design Guide

## Purpose
This document provides guidelines and standards for designing APIs in Node.js TypeScript projects to ensure consistency, usability, and maintainability across the Node.js ecosystem.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Node-TypeScript API Design Principles

These core principles should guide all Node-TypeScript API design decisions:

1. **Type Safety First**
   Leverage TypeScript's type system to catch errors at compile time and provide excellent developer experience.

2. **Consistency**
   APIs should follow consistent patterns, naming conventions, and behaviors across the Node.js application.

3. **Simplicity**
   APIs should be as simple as possible but no simpler. Favor intuitive designs that are easy to understand and use correctly.

4. **Evolvability**
   APIs should be designed to evolve over time without breaking existing clients, using TypeScript versioning strategies.

5. **Discoverability**
   APIs should be self-documenting through TypeScript types and easy to explore with IDE support.

6. **Robustness**
   APIs should handle errors gracefully using Node.js error patterns and provide meaningful feedback to clients.

7. **Security by Design**
   Security considerations should be built into APIs from the beginning, leveraging Node.js security best practices.

8. **Performance Awareness**
   APIs should be designed with Node.js performance characteristics in mind, avoiding blocking operations.

### API Styles

#### Node.js Express/Fastify REST API Guidelines

For Node.js RESTful HTTP APIs using Express.js or Fastify:

**TypeScript Interface Design:**
```typescript
// Define clear interfaces for request/response
interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Use generic response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}
```

**Express.js TypeScript Patterns:**
```typescript
import { Request, Response, NextFunction } from 'express';

// Typed route handlers
app.post('/users', async (req: Request<{}, UserResponse, CreateUserRequest>, res: Response<ApiResponse<UserResponse>>) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Middleware with proper typing
const validateUser = (req: Request<{}, {}, CreateUserRequest>, res: Response, next: NextFunction) => {
  // Validation logic
  next();
};
```

**Fastify TypeScript Patterns:**
```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Schema-first approach with TypeScript
const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 0 }
    }
  }
};

fastify.post<{ Body: CreateUserRequest }>('/users', {
  schema: createUserSchema,
  handler: async (request, reply) => {
    const user = await userService.create(request.body);
    return { success: true, data: user };
  }
});
```

#### REST API Guidelines

For RESTful HTTP APIs:

1. **Resource Naming**
   - Use nouns, not verbs (e.g., `/users`, not `/getUsers`)
   - Use plural nouns for collections (e.g., `/users`, not `/user`)
   - Use kebab-case for multi-word resource names (e.g., `/user-profiles`, not `/userProfiles`)
   - Nest resources to show relationships (e.g., `/users/{id}/orders`)
   - Limit nesting depth to 2-3 levels

2. **HTTP Methods**
   - `GET`: Retrieve resources (never modify state)
   - `POST`: Create new resources or trigger operations
   - `PUT`: Replace resources completely
   - `PATCH`: Update resources partially
   - `DELETE`: Remove resources

3. **Status Codes**
   - `200 OK`: Successful request
   - `201 Created`: Resource successfully created
   - `204 No Content`: Successful request with no response body
   - `400 Bad Request`: Invalid request format or parameters
   - `401 Unauthorized`: Authentication required
   - `403 Forbidden`: Authenticated but not authorized
   - `404 Not Found`: Resource not found
   - `409 Conflict`: Request conflicts with current state
   - `422 Unprocessable Entity`: Validation errors
   - `500 Internal Server Error`: Server-side error

4. **Query Parameters**
   - Use for filtering, sorting, pagination, and field selection
   - Follow consistent naming patterns (e.g., `sort`, `page`, `limit`, `fields`)
   - Document default values and constraints

5. **Versioning**
   - Include version in URL path (e.g., `/v1/users`)
   - Or use Accept header with media type versioning

6. **Pagination**
   - Use `page` and `limit` parameters for page-based pagination
   - Or use `offset` and `limit` for offset-based pagination
   - Include pagination metadata in response (total items, pages, links)

7. **Error Handling**
   - Return appropriate HTTP status codes
   - Include error details in response body
   - Use consistent error format across all APIs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

#### GraphQL API Guidelines

For GraphQL APIs:

1. **Schema Design**
   - Use clear, descriptive type names
   - Follow consistent naming conventions
   - Design for reusability and composition
   - Include descriptions for types, fields, and arguments

2. **Queries and Mutations**
   - Use queries for retrieving data
   - Use mutations for modifying data
   - Name operations clearly and consistently
   - Group related operations logically

3. **Error Handling**
   - Use standard GraphQL error format
   - Include appropriate error codes
   - Provide actionable error messages

4. **Performance Considerations**
   - Implement query complexity analysis
   - Use pagination for large collections
   - Consider batching and caching strategies
   - Be mindful of N+1 query problems

5. **Security**
   - Implement depth and complexity limits
   - Validate and sanitize all inputs
   - Apply proper authorization checks

#### Internal API Guidelines

For internal service-to-service APIs:

1. **Contract First**
   - Define and document the API contract before implementation
   - Use interface definitions or schema languages (e.g., Protocol Buffers, OpenAPI)
   - Treat the contract as the source of truth

2. **Versioning**
   - Version all internal APIs explicitly
   - Support backward compatibility within major versions
   - Communicate breaking changes clearly

3. **Error Handling**
   - Use consistent error codes and formats
   - Include enough detail for debugging
   - Log errors comprehensively

4. **Performance**
   - Optimize for the common case
   - Consider batching for high-frequency operations
   - Be mindful of payload sizes

### Data Formats

#### JSON Guidelines

For JSON payloads:

1. **Naming Conventions**
   - Use camelCase for property names
   - Be consistent with naming patterns
   - Use descriptive, self-explanatory names

2. **Structure**
   - Keep nesting depth reasonable (3-4 levels max)
   - Group related properties logically
   - Consider using envelopes for metadata when appropriate

3. **Types**
   - Use appropriate JSON types (string, number, boolean, object, array, null)
   - Be consistent with date/time formats (prefer ISO 8601)
   - Document format constraints for strings (e.g., patterns, lengths)

4. **Examples**
   - Provide examples for all data structures
   - Include both typical and edge cases

#### Binary Data

For binary data:

1. **Encoding**
   - Use base64 encoding for binary data in JSON
   - Consider dedicated binary protocols for large or frequent transfers

2. **Size Limits**
   - Document size limits clearly
   - Provide alternative upload mechanisms for large files

### Documentation Standards

All APIs should be documented with:

1. **Overview**
   - Purpose and use cases
   - High-level architecture
   - Key concepts

2. **Reference**
   - Complete endpoint/operation listing
   - Request/response formats
   - Parameters and their constraints
   - Error codes and handling

3. **Examples**
   - Request/response examples for common scenarios
   - Code snippets in relevant languages

4. **Guides**
   - Step-by-step tutorials for common tasks
   - Integration patterns and best practices

### API Lifecycle Management

1. **Versioning Strategy**
   - Semantic versioning (MAJOR.MINOR.PATCH)
   - MAJOR version for breaking changes
   - MINOR version for backward-compatible additions
   - PATCH version for backward-compatible fixes

2. **Deprecation Process**
   - Announce deprecations well in advance
   - Document migration paths clearly
   - Use response headers or metadata to signal deprecation
   - Set and communicate end-of-life dates

3. **Breaking Changes**
   - Avoid breaking changes when possible
   - When unavoidable, provide clear migration guidance
   - Consider supporting multiple versions during transition periods

### Security Guidelines

1. **Authentication**
   - Use industry-standard authentication mechanisms
   - Require HTTPS for all API traffic
   - Implement proper token management

2. **Authorization**
   - Apply principle of least privilege
   - Implement fine-grained access controls
   - Validate authorization for every request

3. **Input Validation**
   - Validate all inputs on the server side
   - Use strong typing and schemas
   - Sanitize inputs to prevent injection attacks

4. **Rate Limiting**
   - Implement rate limiting for all APIs
   - Use appropriate limits based on client type
   - Provide clear feedback when limits are exceeded

5. **Sensitive Data**
   - Minimize exposure of sensitive data
   - Apply appropriate data classification
   - Follow relevant compliance requirements

### Testing Requirements

APIs should be tested for:

1. **Functionality**
   - Verify correct behavior for valid inputs
   - Verify appropriate error handling for invalid inputs
   - Test edge cases and boundary conditions

2. **Performance**
   - Response time under expected load
   - Behavior under peak load
   - Resource utilization

3. **Security**
   - Authentication and authorization
   - Input validation and sanitization
   - Protection against common attacks

4. **Compatibility**
   - Backward compatibility with previous versions
   - Compatibility with target client platforms

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [architecture/integration_patterns.md] - complements - Integration patterns use these API design guidelines
  - [cross_cutting/error_handling.md] - details - Error handling strategies for APIs
  - [cross_cutting/security.md] - details - Security considerations for APIs

## Navigation Guidance
- **Access Context:** Use this document when designing new APIs or evaluating existing ones
- **Common Next Steps:** After reviewing these guidelines, typically explore integration patterns or specific API implementations
- **Related Tasks:** API design, API review, integration planning
- **Update Patterns:** This document should be updated when new API design patterns emerge or existing guidelines need refinement

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Role/Agent]

## Change History
- [Date]: Initial creation of API design guide
