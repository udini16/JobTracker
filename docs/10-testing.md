# 10 TESTING

## Testing Checklist

- [ ] **Scraping**: Verify jobs are fetched when searching for "React Remote".
- [ ] **Generation**: Ensure the LLM uses the provided resume and writes a coherent email without hallucinations.
- [ ] **Email Sending**: Confirm emails arrive in the destination inbox.
- [ ] **Tracking**: Open the received email and verify the backend registers the "Opened" status.
- [ ] **Notifications**: Confirm the Telegram bot sends a message immediately upon opening.
