# EmailJS Setup Instructions

To enable the beta tester form to send emails to your inbox, follow these steps:

## 1. Create a Free EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account (allows 200 emails/month)

## 2. Create an Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Follow the setup instructions to connect your Gmail account
5. Copy the **Service ID** (you'll need this)

## 3. Create an Email Template

1. Go to "Email Templates" in the dashboard
2. Click "Create New Template"
3. Use this template:

**Template Name:** Beta Tester Signup

**Subject:** New Beta Tester Signup - {{project}}

**Content:**
```
New beta tester signup for: {{project}}

Name: {{from_name}}
Email: {{from_email}}
Company: {{company}}
Role: {{role}}

You can reply directly to this email to contact them.
```

4. **IMPORTANT**: In the template settings:
   - Set the "To Email" field to: `mr.randallgrouse@gmail.com` (this is set in the template, NOT as a parameter)
   - Set the "From Name" field to: `{{from_name}}`
   - Set the "Reply To" field to: `{{reply_to}}`
   - Make sure "To Email" is NOT a variable - it should be a fixed email address
5. Save the template and copy the **Template ID**

**Common Issues:**
- The "To Email" must be set in the template settings, not sent as a parameter
- Variable names in the template must match exactly: `{{from_name}}`, `{{from_email}}`, `{{company}}`, `{{role}}`, `{{project}}`, `{{reply_to}}`
- Make sure your email service is connected and active

## 4. Get Your Public Key

1. Go to "Account" → "General"
2. Copy your **Public Key** (also called API Key)

## 5. Update the Code

Open `src/components/BetaTesterForm.jsx` and replace these values:

```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';      // Replace with your Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';    // Replace with your Template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';      // Replace with your Public Key
```

## 6. Test It

1. Fill out the form on your portfolio
2. Submit it
3. Check your email at randall.g.rouse@gmail.com

## Troubleshooting

### "Invalid grant. Please reconnect your Gmail account"
This means your Gmail connection has expired. To fix:
1. Go to EmailJS Dashboard → Email Services
2. Find your Gmail service (service_udga989)
3. Click on it to edit
4. Click "Reconnect" or "Re-authorize"
5. Follow the prompts to reconnect your Gmail account
6. Make sure to grant all necessary permissions
7. Save the service

### Other Common Issues:
- Make sure all three IDs are correctly replaced
- Check the EmailJS dashboard for any error logs
- Verify your email service is connected and active
- The free tier allows 200 emails per month
- If "recipients address is empty": Make sure your template uses `{{to_email}}` in the "To Email" field

