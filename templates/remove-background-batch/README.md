# Picsart: Batch Background Removal

## 🎯 What does this workflow do?

This workflow demonstrates how to process multiple images in batch using the Picsart Remove Background node. It automatically removes backgrounds from a list of images, processes them one by one, and saves each result.

Ideal for e-commerce sellers, photographers, and content creators who need to process multiple images efficiently.

## 📋 Setup

### Prerequisites
- n8n instance (cloud or self-hosted)
- Picsart API key from [Picsart Console](https://console.picsart.io/dashboard)
- The `@picsart/n8n-nodes-picsart-creative-apis` package installed

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

4. **Add your image URLs**:
   - Open the "Sample Image URLs" node
   - Update the `imageUrl` values with your actual image URLs
   - Add or remove items as needed
   - Supported formats: JPG, PNG, WEBP

5. **Test the workflow**:
   - Click "Execute Workflow" button
   - Monitor progress through each loop iteration
   - Check outputs in "Save Processed Image" node

## 🎨 Customization

### Input Sources
Replace the "Sample Image URLs" node with:
- **CSV Import**: Read URLs from a CSV file
- **Google Sheets**: Pull URLs from a spreadsheet
- **Database Query**: Get URLs from your database
- **Airtable**: Fetch records with image URLs
- **API Call**: Retrieve URLs from your API

### Background Options

#### Transparent Background (Default)
```javascript
bgColor: "transparent"
```

#### Solid Color Background
```javascript
bgColor: "#FF5733"  // Any hex color
```

#### Image Background
Add `bgImageUrl` parameter:
```javascript
bgImageUrl: "https://example.com/background.jpg"
```

### Output Type
Change the `outputType` parameter:
- `cutout` - Subject only with transparent/colored background
- `mask` - Black and white mask showing the subject area

### Effects
Add visual effects to the background:
- **Blur**: Blur the original background
- **Stroke**: Add outline around the subject
- **Shadow**: Add drop shadow
- **Opacity**: Adjust background transparency

### Batch Size
Modify the "Loop Over Items" node:
- Change `batchSize` to process multiple images simultaneously
- Note: Higher batch size uses more credits but faster processing

### Output Format
Change `format` in "Picsart Remove Background" node:
- `PNG` - Recommended for transparency
- `JPG` - Smaller files (backgrounds only)
- `WEBP` - Modern format with transparency support

## 💡 Use Cases

### E-commerce
- Remove backgrounds from product photos
- Create consistent catalog images
- Prepare images for marketplace listings (Amazon, eBay, Etsy)
- Generate images for multiple platforms with different backgrounds

### Photography
- Batch process portrait photos
- Create consistent studio-style images
- Prepare photos for clients
- Generate images for portfolios

### Marketing & Design
- Process event photos
- Create marketing materials with consistent backgrounds
- Prepare images for presentations
- Generate social media content

### Real Estate
- Process property interior photos
- Remove distracting backgrounds
- Create consistent listing images

## 🔄 Workflow Flow

1. **Manual Trigger**: Start the workflow
2. **Sample Image URLs**: Loads the list of image URLs to process
3. **Loop Over Items**: Processes images one by one
4. **Picsart Remove Background**: AI removes the background
5. **Save Processed Image**: Saves each result with unique filename
6. **Loop Complete**: Finishes when all images are processed

## 📊 What You Get

For each processed image:
- **Binary Data**: The image file with background removed
- **JSON Data**:
  - `url`: Direct link to the processed image
  - `credits`: Number of API credits used per image
  - Processing metadata

## 🚀 Advanced Features

### Add Cloud Storage
After "Save Processed Image", add nodes to:
- Upload to **Google Drive**
- Upload to **Dropbox**
- Upload to **AWS S3**
- Upload to **Azure Blob Storage**

### Add Notifications
Insert notification nodes:
- **Email**: Send completion notification
- **Slack**: Post to a channel
- **Webhook**: Notify your application

### Error Handling
Add error workflow:
- Catch failed images
- Log errors to a spreadsheet
- Retry failed images
- Send error notifications

### Progress Tracking
Add tracking nodes:
- Update Google Sheet with progress
- Send status to webhook
- Log to database

## 🔧 Troubleshooting

**Issue**: Loop not processing all images
- **Solution**: Check that "Loop Over Items" is properly connected back from "Save Processed Image"

**Issue**: "Invalid image URL" error
- **Solution**: Ensure all URLs are publicly accessible and return valid images

**Issue**: Running out of credits
- **Solution**: 
  - Check your balance at https://console.picsart.io
  - Process fewer images per run
  - Top up your credits

**Issue**: Slow processing
- **Solution**: 
  - Increase batch size (processes more simultaneously)
  - Ensure good network connection
  - Consider processing during off-peak hours

## 💰 Credit Usage

Background removal typically uses **1 credit per image**. For a batch of 100 images:
- Transparent background: ~100 credits
- With effects (blur, shadow): ~100 credits
- Different output types: same credit cost

Check current pricing at https://picsart.io/api/pricing

## 📚 Additional Resources

- [Picsart Remove Background API Docs](https://docs.picsart.io/docs/remove-background-api)
- [n8n Loop Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/)
- [Picsart Console](https://console.picsart.io/)

## 🤝 Support

For issues or questions:
- GitHub: [n8n-plugin Issues](https://github.com/PicsArt/n8n-plugin/issues)
- Picsart Support: https://support.picsart.com
- n8n Community: https://community.n8n.io/


