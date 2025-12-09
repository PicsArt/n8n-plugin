# Picsart: Complete Image Processing API

## 🎯 What does this workflow do?

This workflow creates a complete image processing API using webhooks. It accepts HTTP POST requests with image URLs and processing parameters, then routes the image through either the Enhance or Remove Background node based on the request, and returns the processed result.

Perfect for integrating Picsart's AI-powered image processing into your applications, websites, or automation pipelines.

## 📋 Setup

### Prerequisites
- n8n instance (cloud or self-hosted)
- Picsart API key from [Picsart Console](https://console.picsart.io/dashboard)
- The `@picsart/n8n-nodes-picsart-creative-apis` package installed
- Ability to receive webhooks (public URL or ngrok for testing)

### Configuration Steps

1. **Install the Picsart nodes** (if not already installed):
   - n8n Cloud: Settings → Community Nodes → Install → `@picsart/n8n-nodes-picsart-creative-apis`
   - Self-hosted: `npm install @picsart/n8n-nodes-picsart-creative-apis` and restart n8n

2. **Add Picsart API credentials**:
   - Go to Settings → Credentials
   - Click "Add Credential" → Search for "Picsart API"
   - Enter your API key from https://console.picsart.io
   - Save the credential

3. **Import the workflow**:
   - Download the `workflow.json` file
   - In n8n: Click "+ Add workflow" → "Import from File"
   - Select the downloaded JSON file

4. **Activate the workflow**:
   - Toggle the workflow to "Active" (switch in top-right corner)
   - The workflow must be active to receive webhook requests

5. **Copy the webhook URL**:
   - Click on the "Webhook" node
   - Copy the "Production URL" shown
   - This is your API endpoint

## 🚀 Usage

### API Endpoint

```
POST https://your-n8n-instance.com/webhook/process-image
```

### Request Format

#### Enhance Image
```json
{
  "imageUrl": "https://example.com/product.jpg",
  "operation": "enhance",
  "upscaleFactor": "4"
}
```

#### Remove Background
```json
{
  "imageUrl": "https://example.com/photo.jpg",
  "operation": "remove-bg",
  "bgColor": "transparent"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageUrl` | string | Yes | URL of the image to process |
| `operation` | string | Yes | `"enhance"` or `"remove-bg"` |
| `upscaleFactor` | string | No | `"2"`, `"4"`, `"6"`, `"8"`, or `"16"` (default: `"4"`) |
| `bgColor` | string | No | Hex color or `"transparent"` (default: `"transparent"`) |

### Response Format

```json
{
  "processedImage": "base64-encoded-image-data",
  "operation": "enhance",
  "creditsUsed": 10,
  "outputUrl": "https://picsart-cdn.com/processed-image.png"
}
```

## 🧪 Testing the API

### Using cURL

**Enhance Image:**
```bash
curl -X POST https://your-n8n-instance.com/webhook/process-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "operation": "enhance",
    "upscaleFactor": "4"
  }'
```

**Remove Background:**
```bash
curl -X POST https://your-n8n-instance.com/webhook/process-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "operation": "remove-bg",
    "bgColor": "#FFFFFF"
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('https://your-n8n-instance.com/webhook/process-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg',
    operation: 'enhance',
    upscaleFactor: '4'
  })
});

const result = await response.json();
console.log('Processed:', result.outputUrl);
console.log('Credits used:', result.creditsUsed);
```

### Using Python

```python
import requests

response = requests.post(
    'https://your-n8n-instance.com/webhook/process-image',
    json={
        'imageUrl': 'https://example.com/image.jpg',
        'operation': 'enhance',
        'upscaleFactor': '4'
    }
)

result = response.json()
print(f"Processed: {result['outputUrl']}")
print(f"Credits used: {result['creditsUsed']}")
```

### Using Postman

1. Create a new POST request
2. URL: Your webhook URL
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON with parameters
5. Send request

## 🎨 Customization

### Add Authentication
Secure your API by adding authentication:
1. Add an "HTTP Request" node after webhook
2. Check for API key in headers
3. Use "IF" node to validate
4. Return 401 if unauthorized

### Add Rate Limiting
Prevent abuse:
1. Add "Code" node to track requests
2. Store request counts in memory/database
3. Return 429 if rate limit exceeded

### Add Input Validation
Ensure valid inputs:
1. Add "Code" node after webhook
2. Validate `imageUrl` format
3. Check parameter values
4. Return 400 for invalid inputs

### Add Logging
Track API usage:
1. Add "Google Sheets" node to log requests
2. Add "Database" node to store metrics
3. Add "Webhook" node to send to analytics

### Add File Upload Support
Accept direct file uploads:
1. Modify webhook to accept multipart/form-data
2. Add file handling logic
3. Upload to temporary storage
4. Process from temporary URL

### Extend Operations
Add more processing options:
1. Add more Picsart nodes (when available)
2. Add image transformation nodes
3. Add conditional routing for different operations
4. Chain multiple operations

## 💡 Use Cases

### SaaS Applications
- Offer image processing as a feature
- Build image editing tools
- Create marketplace image optimizer
- Power mobile app backends

### E-commerce Platforms
- Automated product image processing
- Batch processing for new listings
- On-demand image enhancement
- Background removal service

### Content Management Systems
- Automated image optimization
- User-uploaded image processing
- Media library enhancement
- Thumbnail generation

### Marketing Automation
- Campaign image processing
- Social media image preparation
- Email marketing asset generation
- Ad creative optimization

### Photo Services
- Portrait background removal
- Bulk photo enhancement
- Client delivery processing
- Event photo processing

## 🔄 Workflow Flow

1. **Webhook**: Receives POST request with image URL and parameters
2. **Which Operation?**: Routes to appropriate processing node
   - If `operation === "enhance"` → Picsart Enhance
   - Otherwise → Picsart Remove Background
3. **Picsart Enhance** or **Picsart Remove Background**: Processes the image
4. **Format Response**: Structures the output data
5. **Respond to Webhook**: Sends JSON response back to caller

## 📊 Response Details

### Success Response (200)
```json
{
  "processedImage": "base64...",
  "operation": "enhance",
  "creditsUsed": 10,
  "outputUrl": "https://picsart-cdn.com/..."
}
```

### Error Responses

**400 Bad Request**: Invalid parameters
```json
{
  "error": "Invalid operation. Must be 'enhance' or 'remove-bg'"
}
```

**500 Internal Server Error**: Processing failed
```json
{
  "error": "Image processing failed",
  "details": "..."
}
```

## 🚀 Deployment Tips

### For Production

1. **Use a custom domain**: Point a subdomain to your n8n instance
2. **Enable HTTPS**: Ensure SSL is properly configured
3. **Set up monitoring**: Track uptime and errors
4. **Configure backups**: Regular workflow backups
5. **Add error handling**: Comprehensive error responses
6. **Implement logging**: Track all requests and errors
7. **Set up alerts**: Notify on failures

### Scaling Considerations

- **Queue System**: Add queue for high-volume processing
- **Caching**: Cache frequently processed images
- **Load Balancing**: Distribute across multiple n8n instances
- **Async Processing**: Return immediately, process in background
- **Webhook Timeout**: Consider async for long operations

## 🔧 Troubleshooting

**Issue**: Webhook not receiving requests
- **Solution**: Ensure workflow is activated and URL is correct

**Issue**: 404 Not Found
- **Solution**: Check webhook path and n8n instance URL

**Issue**: Timeout errors
- **Solution**: Large images take longer; consider async processing

**Issue**: Invalid image URL
- **Solution**: Ensure URL is publicly accessible and returns valid image

**Issue**: Credits exhausted
- **Solution**: Check balance at https://console.picsart.io

## 💰 Credit Usage

Each API call uses credits based on the operation:
- **Enhance**: 10-50 credits (depends on upscale factor)
  - 2x: ~10 credits
  - 4x: ~20 credits
  - 8x: ~40 credits
  - 16x: ~50 credits
- **Remove Background**: ~1 credit

Monitor your usage at https://console.picsart.io

## 📚 Additional Resources

- [Picsart API Documentation](https://docs.picsart.io/)
- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Picsart Console](https://console.picsart.io/)
- [API Best Practices](https://docs.n8n.io/hosting/security/)

## 🤝 Support

For issues or questions:
- GitHub: [n8n-plugin Issues](https://github.com/PicsArt/n8n-plugin/issues)
- Picsart Support: https://support.picsart.com
- n8n Community: https://community.n8n.io/

## 📄 License

MIT © Picsart


