# Testing Strategy for .af Format Compliance

## Purpose
This document outlines the comprehensive testing strategy for ensuring the mastra-af-letta package complies with the .af format specification and maintains data integrity through conversion operations.

## Classification
- **Domain:** Specifications
- **Stability:** Semi-stable
- **Abstraction:** Technical
- **Confidence:** Established

## Content

### Testing Philosophy

The testing strategy is built around three core principles:

1. **Specification Compliance**: Every requirement in the .af format specification must be validated
2. **Data Integrity**: No data loss or corruption during import/export operations
3. **Round-Trip Fidelity**: Converting from .af → Mastra → .af should preserve all original data

### Test Categories

#### 1. Specification Compliance Tests (`specification-compliance.test.ts`)

**Purpose**: Validate that the package correctly implements the .af format specification.

**Test Areas**:
- **Valid File Parsing**: Ensures valid .af files are parsed correctly
- **Invalid File Rejection**: Ensures invalid files are rejected with appropriate errors
- **Required Field Validation**: Verifies all mandatory fields are present and correctly typed
- **Format Validation**: Tests timestamp formats, JSON Schema validation, etc.
- **Extended Features**: Validates mastra-af-letta specific extensions (MCP tools, auth refs)
- **Security**: Tests for credential exposure and input validation

**Test Fixtures**:
- `valid-minimal.af`: Minimal valid agent file
- `valid-complete.af`: Complete agent with all features
- `invalid-missing-required.af`: Missing required fields
- `invalid-bad-timestamp.af`: Invalid timestamp format
- `invalid-tool-missing-source.af`: Python tool without source code
- `invalid-bad-message-indices.af`: Invalid message index references

#### 2. Round-Trip Compliance Tests (`round-trip-compliance.test.ts`)

**Purpose**: Ensure lossless conversion between .af format and Mastra format.

**Test Areas**:
- **Lossless Conversion**: Verify all data is preserved through conversion cycles
- **Conversion Warnings**: Test that appropriate warnings are generated
- **Data Integrity**: Validate JSON structure, timestamp formats, numeric precision
- **Special Characters**: Test Unicode and special character handling
- **Error Handling**: Graceful handling of conversion errors
- **Version Compatibility**: Support for different .af specification versions

### Test Implementation Details

#### Fixture Management

Test fixtures are stored in `app/test/fixtures/` and include:
- Valid examples demonstrating all supported features
- Invalid examples for each type of validation error
- Edge cases and boundary conditions

#### Validation Levels

1. **Syntactic Validation**: JSON parsing and basic structure
2. **Semantic Validation**: Field types, ranges, and constraints
3. **Cross-Reference Validation**: Index references, tool rule validation
4. **Business Logic Validation**: Tool-specific requirements, authentication refs

#### Error Testing Strategy

Each validation rule has corresponding negative tests:
- Missing required fields
- Invalid data types
- Out-of-range values
- Malformed references
- Security violations

### Extended Feature Testing

#### MCP Tool Support

Tests verify:
- MCP metadata structure validation
- Authentication reference handling
- Transport protocol validation
- Server endpoint validation

#### Authentication References

Tests ensure:
- No embedded credentials in any format
- Proper auth reference structure
- Support for all auth provider types
- Metadata preservation

#### Tool Type Support

Each tool type has specific tests:
- **JSON Schema**: Parameter validation
- **Python**: Source code requirement
- **JavaScript**: Source code requirement
- **MCP**: Extended metadata validation

### Performance and Security Testing

#### Large File Handling

Tests include:
- Large conversation histories (1000+ messages)
- Large tool collections
- Large memory blocks
- Performance degradation detection

#### Security Validation

Tests verify:
- No credential exposure in parsed output
- Input sanitization
- File size limits
- Malicious payload rejection

### Coverage Requirements

Target coverage levels:
- **Line Coverage**: 95%+ for core parsing logic
- **Branch Coverage**: 90%+ for validation paths
- **Function Coverage**: 100% for public API

Critical paths requiring 100% coverage:
- All validation functions
- Format conversion logic
- Error handling paths
- Security checks

### Continuous Integration

#### Test Execution

Tests run on:
- Every commit to main branch
- All pull requests
- Nightly builds with extended test suites
- Before each release

#### Test Environments

- Node.js 18, 20, 22 (LTS versions)
- Different operating systems (Linux, macOS, Windows)
- Various dependency versions

### Compliance Verification

#### Specification Alignment

Regular verification that tests match specification:
- Manual review of test cases against specification
- Automated specification compliance checking
- Cross-reference with upstream .af format changes

#### Documentation Sync

Test documentation updates when:
- New specification requirements added
- Test cases modified
- Coverage requirements changed
- New edge cases discovered

### Test Data Management

#### Fixture Generation

Process for creating test fixtures:
1. Start with real-world examples
2. Anonymize sensitive data
3. Add edge cases and boundary conditions
4. Validate against specification
5. Include in automated test suite

#### Fixture Maintenance

Regular updates to ensure:
- Compatibility with specification changes
- Coverage of new features
- Removal of deprecated patterns
- Performance optimization

### Failure Analysis

#### Test Failure Classification

1. **Specification Violations**: Tests fail due to format non-compliance
2. **Implementation Bugs**: Logic errors in conversion code
3. **Data Integrity Issues**: Information loss during conversion
4. **Performance Regressions**: Unacceptable performance degradation

#### Debugging Process

1. Isolate failing test case
2. Compare against specification requirements
3. Trace through conversion logic
4. Identify root cause
5. Implement fix with additional test coverage

### Future Testing Enhancements

#### Planned Improvements

1. **Property-Based Testing**: Generate random valid .af files for testing
2. **Fuzzing**: Test with malformed and edge-case inputs
3. **Performance Benchmarking**: Automated performance regression detection
4. **Cross-Platform Testing**: Ensure compatibility across different environments

#### Integration Testing

Future integration with:
- Actual Mastra.ai agent runtime
- Real Letta agent imports
- Production agent file examples
- Community-contributed test cases

## Relationships
- **Parent Nodes:** [specifications/af_format_specification.md]
- **Child Nodes:** 
  - [testing/test_fixtures.md] - details - Test fixture documentation
  - [testing/coverage_requirements.md] - details - Coverage standards
- **Related Nodes:** 
  - [architecture/conversion_architecture.md] - tests - Conversion logic
  - [processes/validation_workflow.md] - implements - Validation process

## Navigation Guidance
- **Access Context:** Reference when implementing new tests or debugging failures
- **Common Next Steps:** Review specific test implementations or coverage reports
- **Related Tasks:** Test development, debugging, specification updates
- **Update Patterns:** Update when specification changes or new test requirements emerge

## Metadata
- **Created:** 2025-07-13
- **Last Updated:** 2025-07-13
- **Updated By:** AI Assistant

## Change History
- 2025-07-13: Initial creation of testing strategy documentation