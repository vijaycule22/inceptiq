# Email Setup Guide for InceptIQ

This guide explains how email functionality works in the InceptIQ application, particularly for password reset emails.

## How Email Works

### Development Environment

In development, the application uses **Ethereal Email** (a fake SMTP service) for testing:

1. **Automatic Setup**: When you start the application, it automatically creates a test email account
2. **Console Logging**: Email content is logged to the console for easy testing
3. **Preview URLs**: Ethereal provides preview URLs to view sent emails

### Production Environment

In production, you can configure real email services like Gmail, SendGrid, or AWS SES.

## Environment Variables

### Required for Production

```env
# Email Configuration
EMAIL_SERVICE=gmail                    # 'gmail', 'sendgrid', 'aws-ses', etc.
EMAIL_USER=your-email@gmail.com        # Your email address
EMAIL_PASSWORD=your-app-password       # Your email password or app password
EMAIL_FROM=InceptIQ <noreply@inceptiq.com>  # From address
FRONTEND_URL=https://yourdomain.com    # Your frontend URL

# Other required variables
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
```

### Development (Optional)

```env
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
```

## Email Service Providers

### 1. Gmail

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use App Password, not regular password
```

**Setup Steps:**

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the generated 16-character password

### 2. SendGrid

```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Setup Steps:**

1. Create a SendGrid account
2. Generate an API key
3. Verify your sender domain

### 3. AWS SES

```env
EMAIL_SERVICE=aws-ses
EMAIL_USER=your-aws-access-key
EMAIL_PASSWORD=your-aws-secret-key
```

**Setup Steps:**

1. Create an AWS account
2. Set up SES in your preferred region
3. Verify your email address or domain

### 4. Custom SMTP

```env
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false  # true for 465, false for other ports
```

## Testing Email Functionality

### 1. Development Testing

1. Start the backend server: `npm run start:dev`
2. Request a password reset from the frontend
3. Check the console for email logs and preview URLs

### 2. Production Testing

1. Set up your email service with the environment variables
2. Test with a real email address
3. Check your email inbox for the reset link

## Email Templates

The application includes both HTML and text versions of password reset emails:

### HTML Template Features

- **Responsive Design**: Works on desktop and mobile
- **Branded Header**: InceptIQ logo and branding
- **Clear Call-to-Action**: Prominent reset button
- **Security Warnings**: Important security information
- **Fallback Link**: Text link if button doesn't work

### Text Template Features

- **Plain Text**: Compatible with all email clients
- **Clear Instructions**: Step-by-step guidance
- **Security Information**: Important warnings and notes

## Security Features

### Password Reset Security

1. **Secure Tokens**: 32-byte random hex tokens
2. **Time Expiration**: Tokens expire after 1 hour
3. **Single Use**: Tokens can only be used once
4. **Email Privacy**: Doesn't reveal if email exists
5. **HTTPS Links**: Secure reset URLs

### Email Security

1. **SPF/DKIM**: Configure with your email provider
2. **Rate Limiting**: Implement to prevent abuse
3. **Logging**: Monitor for suspicious activity
4. **Validation**: Email format and domain validation

## Troubleshooting

### Common Issues

#### 1. "Failed to send email" error

- Check email credentials
- Verify email service configuration
- Check network connectivity
- Review email provider limits

#### 2. Emails not received

- Check spam/junk folder
- Verify sender email address
- Check email provider settings
- Test with different email addresses

#### 3. Reset links not working

- Check FRONTEND_URL configuration
- Verify token expiration
- Check database connectivity
- Review application logs

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_EMAIL=true
```

This will log detailed email sending information to help troubleshoot issues.

## Best Practices

### 1. Email Configuration

- Use environment variables for all sensitive data
- Never commit email credentials to version control
- Use app passwords instead of regular passwords
- Configure SPF and DKIM records

### 2. Security

- Implement rate limiting for password reset requests
- Log all password reset attempts
- Monitor for suspicious activity
- Regularly rotate email credentials

### 3. User Experience

- Send confirmation emails for successful resets
- Provide clear error messages
- Include support contact information
- Test email templates across different clients

## Example Email Flow

1. **User requests password reset**

   - Enters email address
   - System validates email format
   - Generates secure reset token

2. **Email is sent**

   - HTML and text versions included
   - Contains reset link with token
   - Includes security warnings

3. **User clicks reset link**

   - Frontend validates token
   - User enters new password
   - System updates password and invalidates token

4. **Confirmation**
   - User is redirected to login
   - Success message displayed
   - Token marked as used

This email system provides a secure, user-friendly way to handle password resets while maintaining security best practices.
