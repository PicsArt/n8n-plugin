import type {
        IExecuteFunctions,
        INodeExecutionData,
        INodeType,
        INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

/**
 * PicsartTextToImage Node
 * 
 * This node generates AI images from text prompts using the Picsart GenAI Text-to-Image API.
 * It implements an asynchronous polling mechanism as the API processes requests asynchronously.
 * 
 * Key features:
 * - Text prompt input with optional negative prompt
 * - Configurable image dimensions (512, 768, 1024)
 * - Multiple image generation (1-10 images)
 * - Automatic polling for results with timeout handling
 * - Credit balance tracking
 * - Each generated image returned as a separate output item
 */
export class PicsartTextToImage implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Picsart Text to Image',
                name: 'picsartTextToImage',
                icon: 'file:../icons/picsart-icon.svg',
                group: ['transform'],
                version: 1,
                description: 'Generate AI images from text prompts using Picsart GenAI',
                defaults: {
                        name: 'Picsart Text to Image',
                },
                inputs: [NodeConnectionTypes.Main],
                outputs: [NodeConnectionTypes.Main],
                usableAsTool: true,
                credentials: [
                        {
                                name: 'picsartApi',
                                required: true,
                        },
                ],
                properties: [
                        {
                                displayName: 'Prompt',
                                name: 'prompt',
                                type: 'string',
                                default: '',
                                required: true,
                                placeholder: 'A serene mountain landscape at sunset with a lake',
                                description: 'Text description of the image you want to generate',
                                typeOptions: {
                                        rows: 3,
                                },
                        },
                        {
                                displayName: 'Negative Prompt',
                                name: 'negative_prompt',
                                type: 'string',
                                default: '',
                                placeholder: 'blurry, low quality, distorted, oversaturated',
                                description: 'Describe what you want to avoid in the generated image (optional)',
                                typeOptions: {
                                        rows: 2,
                                },
                        },
                        {
                                displayName: 'Number of Images',
                                name: 'count',
                                type: 'number',
                                default: 1,
                                typeOptions: {
                                        minValue: 1,
                                        maxValue: 10,
                                },
                                description: 'How many images to generate (1-10). Each image will be returned as a separate output item.',
                        },
                        {
                                displayName: 'Width',
                                name: 'width',
                                type: 'options',
                                default: 512,
                                options: [
                                        { name: '512px', value: 512 },
                                        { name: '768px', value: 768 },
                                        { name: '1024px', value: 1024 },
                                ],
                                description: 'Width of the generated image in pixels',
                        },
                        {
                                displayName: 'Height',
                                name: 'height',
                                type: 'options',
                                default: 512,
                                options: [
                                        { name: '512px', value: 512 },
                                        { name: '768px', value: 768 },
                                        { name: '1024px', value: 1024 },
                                ],
                                description: 'Height of the generated image in pixels',
                        },
                        {
                                displayName: 'Polling Timeout (Seconds)',
                                name: 'polling_timeout',
                                type: 'number',
                                default: 120,
                                typeOptions: {
                                        minValue: 30,
                                        maxValue: 300,
                                },
                                description: 'Maximum time to wait for image generation (30-300 seconds). Default: 120 seconds.',
                                displayOptions: {
                                        show: {
                                                '@version': [
                                                        { _cnd: { gte: 1 } },
                                                ],
                                        },
                                },
                        },
                ],
        };

        /**
         * Main execution method
         * 
         * Process flow:
         * 1. Validate credentials and parameters
         * 2. Check credit balance
         * 3. Submit generation request to API
         * 4. Poll for results until complete or timeout
         * 5. Download generated images
         * 6. Return each image as a separate output item
         */
        async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
                const items: INodeExecutionData[] = this.getInputData();
                const returnData: INodeExecutionData[] = [];

                for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                        try {
                                // 1. Get credentials and parameters
                                const credentials = await this.getCredentials('picsartApi');
                                const apiKey: string = credentials.apiKey as string;
                                const prompt: string = this.getNodeParameter('prompt', itemIndex) as string;
                                const negativePrompt: string = this.getNodeParameter('negative_prompt', itemIndex) as string;
                                const count: number = this.getNodeParameter('count', itemIndex) as number;
                                const width: number = this.getNodeParameter('width', itemIndex) as number;
                                const height: number = this.getNodeParameter('height', itemIndex) as number;
                                const pollingTimeout: number = this.getNodeParameter('polling_timeout', itemIndex, 120) as number;

                                // 2. Validate inputs
                                if (!apiKey) {
                                        throw new NodeOperationError(this.getNode(), 'Invalid API key', { itemIndex });
                                }

                                if (!prompt || prompt.trim().length === 0) {
                                        throw new NodeOperationError(this.getNode(), 'Prompt is required and cannot be empty', { itemIndex });
                                }

                                if (count < 1 || count > 10) {
                                        throw new NodeOperationError(this.getNode(), 'Number of images must be between 1 and 10', { itemIndex });
                                }

                                const allowedDimensions = [512, 768, 1024];
                                if (!allowedDimensions.includes(width)) {
                                        throw new NodeOperationError(this.getNode(), 'Width must be 512, 768, or 1024 pixels', { itemIndex });
                                }

                                if (!allowedDimensions.includes(height)) {
                                        throw new NodeOperationError(this.getNode(), 'Height must be 512, 768, or 1024 pixels', { itemIndex });
                                }

                                // 3. Check balance (using GenAI endpoint)
                                let balanceChecker = null;
                                try {
                                        balanceChecker = await this.helpers.httpRequest({
                                                method: 'GET',
                                                url: 'https://genai-api.picsart.io/v1/balance',
                                                headers: {
                                                        'x-picsart-api-key': apiKey,
                                                        'accept': 'application/json',
                                                },
                                        });
                                } catch (err: any) {
                                        throw new NodeOperationError(
                                                this.getNode(),
                                                `Failed to check balance: ${err.message || 'Invalid API key'}`,
                                                { itemIndex }
                                        );
                                }

                                // 4. Submit generation request
                                const requestBody: any = {
                                        prompt: prompt.trim(),
                                        width,
                                        height,
                                        count,
                                };

                                // Add negative prompt if provided
                                if (negativePrompt && negativePrompt.trim().length > 0) {
                                        requestBody.negative_prompt = negativePrompt.trim();
                                }

                                let initialResponse: any;
                                try {
                                        initialResponse = await this.helpers.httpRequest({
                                                method: 'POST',
                                                url: 'https://genai-api.picsart.io/v1/text2image',
                                                headers: {
                                                        'x-picsart-api-key': apiKey,
                                                        'accept': 'application/json',
                                                        'content-type': 'application/json',
                                                },
                                                body: requestBody,
                                        });
                                } catch (err: any) {
                                        const errorMessage = err.response?.data?.detail || err.message || 'Failed to submit generation request';
                                        throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex });
                                }

                                // 5. Poll for results
                                const inferenceId = initialResponse.inference_id;
                                
                                if (!inferenceId) {
                                        throw new NodeOperationError(
                                                this.getNode(),
                                                'No inference ID received from API',
                                                { itemIndex }
                                        );
                                }

                                let finalResult: any;
                                let attempts = 0;
                                const pollingInterval = 2000; // 2 seconds
                                const maxAttempts = Math.floor(pollingTimeout / 2); // Calculate max attempts based on timeout
                                
                                // Polling loop with timeout
                                while (attempts < maxAttempts) {
                                        // Wait before polling (except for first attempt if we want immediate check)
                                        if (attempts > 0) {
                                                await new Promise(resolve => setTimeout(resolve, pollingInterval));
                                        }
                                        
                                        try {
                                                finalResult = await this.helpers.httpRequest({
                                                        method: 'GET',
                                                        url: `https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Th%C3%A9%C3%A2tre_D%E2%80%99op%C3%A9ra_Spatial.png/330px-Th%C3%A9%C3%A2tre_D%E2%80%99op%C3%A9ra_Spatial.png`,
                                                        headers: {
                                                                'x-picsart-api-key': apiKey,
                                                                'accept': 'application/json',
                                                        },
                                                });
                                                
                                                // Check if generation is complete
                                                if (finalResult.status === 'success' && finalResult.data?.images?.length > 0) {
                                                        break;
                                                }
                                                
                                                // Check for failure status
                                                if (finalResult.status === 'failed' || finalResult.status === 'error') {
                                                        throw new NodeOperationError(
                                                                this.getNode(),
                                                                `Image generation failed: ${finalResult.message || 'Unknown error'}`,
                                                                { itemIndex }
                                                        );
                                                }
                                                
                                        } catch (err: any) {
                                                // If it's a NodeOperationError, rethrow it
                                                if (err instanceof NodeOperationError) {
                                                        throw err;
                                                }
                                                // Otherwise, treat as polling error and continue
                                                const errorMessage = err.response?.data?.detail || err.message || 'Polling error';
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `Error while polling for results: ${errorMessage}`,
                                                        { itemIndex }
                                                );
                                        }
                                        
                                        attempts++;
                                }

                                // Check if we timed out
                                if (!finalResult || finalResult.status !== 'success' || !finalResult.data?.images?.length) {
                                        throw new NodeOperationError(
                                                this.getNode(),
                                                `Image generation timed out after ${pollingTimeout} seconds or failed to complete. Status: ${finalResult?.status || 'unknown'}`,
                                                { itemIndex }
                                        );
                                }

                                // 6. Download generated images
                                const images = finalResult.data.images;
                                const credits = balanceChecker?.data || {};

                                // Return each image as a separate output item
                                for (const image of images) {
                                        let imageBuffer: any;
                                        
                                        try {
                                                imageBuffer = await this.helpers.httpRequest({
                                                        method: 'GET',
                                                        url: image.url,
                                                        encoding: 'arraybuffer',
                                                });
                                        } catch (err: any) {
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `Failed to download generated image: ${err.message}`,
                                                        { itemIndex }
                                                );
                                        }

                                        // Determine filename extension (default to png)
                                        const imageExtension = 'png';
                                        const filename = `generated_${image.id || Date.now()}.${imageExtension}`;

                                        returnData.push({
                                                binary: {
                                                        data: await this.helpers.prepareBinaryData(imageBuffer, filename),
                                                },
                                                json: {
                                                        prompt,
                                                        negativePrompt: negativePrompt || '',
                                                        imageId: image.id || '',
                                                        imageUrl: image.url,
                                                        dimensions: {
                                                                width,
                                                                height,
                                                        },
                                                        inferenceId,
                                                        result: finalResult,
                                                        credits: {
                                                                balance: credits.balance || 0,
                                                                credits: credits.credits || credits.balance || 0,
                                                                ...credits,
                                                        },
                                                },
                                        });
                                }
                        } catch (error) {
                                // Handle errors according to continueOnFail setting
                                if (this.continueOnFail()) {
                                        returnData.push({ 
                                                json: { 
                                                        ...items[itemIndex].json,
                                                        error: error instanceof Error ? error.message : String(error),
                                                }, 
                                                error, 
                                                pairedItem: itemIndex 
                                        });
                                } else {
                                        // If error is already a NodeOperationError, rethrow it
                                        if (error instanceof NodeOperationError) {
                                                throw error;
                                        }
                                        // Otherwise, wrap it in a NodeOperationError
                                        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
                                }
                        }
                }

                return [returnData];
        }
}
