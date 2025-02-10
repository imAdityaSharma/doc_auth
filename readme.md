# Healthcare Management System API Documentation

## Authentication
- **Login** (`POST /login`)
  - Authenticates users with email/password
  - Returns JWT token for authorization
  - Redirects based on role (patient/doctor/paramedic)

- **Registration** (`POST /register`) 
  - Creates new user accounts
  - Supports different roles (patient/doctor)
  - Validates required fields
  - Returns success/failure message

- **Logout** (`GET /logout`)
  - Clears JWT token
  - Removes authorization headers
  - Redirects to home page

## Patient APIs
- **Dashboard** (`GET /puser/dashboard`)
  - Fetches patient profile data
  - Returns upcoming appointments
  - Returns current prescriptions
  - Requires authentication

## HTTP Client Setup
- Base URL: `https://localhost:5000`
- Default timeout: 1000ms
- Content-Type: application/json
- Supports:
  - GET requests with error handling
  - POST requests with error handling

## Authentication Flow
1. User logs in with credentials
2. Server validates and returns JWT token
3. Token stored in localStorage
4. Token added to Authorization header
5. Protected routes check token validity
6. Token cleared on logout

## Form Implementations
### Patient Registration
- Multi-step form (3 steps)
- Collects:
  - Personal information
  - Medical history
  - Current medications
  - Past surgeries
- Field validation
- Progress tracking

### Doctor Registration  
- Single page form
- Collects:
  - Personal details
  - Professional credentials
- Required field validation

### Login Form
- Email validation
- Password validation 
- Role-based redirects
- Error handling

## Known Issues and Future Improvements

### Security
- Need to implement HTTPS for all API endpoints
- Add rate limiting for login attempts
- Implement password complexity requirements
- Add session timeout handling
- Enable CORS protection

### Form Validation
- Add client-side validation for all forms
- Improve error messages and feedback
- Add input sanitization
- Implement real-time validation

### User Experience
- Add loading states during API calls
- Improve error handling UX
- Add form autosave functionality
- Implement password reset flow
- Add email verification

### Performance
- Optimize API response times
- Implement request caching
- Add pagination for large data sets
- Optimize bundle size

### Testing
- Add unit tests for components
- Add integration tests for API flows
- Add end-to-end testing
- Implement test coverage reporting

### Accessibility
- Add ARIA labels
- Improve keyboard navigation
- Add screen reader support
- Ensure proper contrast ratios

### Mobile Responsiveness
- Improve mobile form layouts
- Add touch-friendly UI elements
- Optimize for different screen sizes

### Data Management
- Add data backup functionality
- Implement audit logging
- Add data export capabilities
- Improve error logging
