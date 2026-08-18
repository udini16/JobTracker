# 19 SECURITY GUIDELINES

1. **Environment Variables**: Never commit the `.env` file. All API keys (OpenAI, Resend, Telegram) must remain secret.
2. **CORS**: Currently set to allow all origins during development. In production, restrict the `cors()` middleware to only allow requests from the frontend domain.
3. **Sanitization**: Ensure inputs (like resume text) are safely handled and not rendered directly as raw HTML to prevent XSS.
