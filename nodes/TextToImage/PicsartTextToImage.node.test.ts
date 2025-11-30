/**
 * Comprehensive test suite for PicsartTextToImage node
 * 
 * Tests cover:
 * - Basic functionality
 * - Input validation
 * - Configuration options
 * - API integration
 * - Error handling
 * - Polling mechanism
 * - Multiple outputs
 * - Edge cases
 */

import { PicsartTextToImage } from './PicsartTextToImage.node';
import type { IExecuteFunctions } from 'n8n-workflow';

describe('PicsartTextToImage', () => {
        let textToImage: PicsartTextToImage;
        let mockExecuteFunctions: IExecuteFunctions;
        let mockHttpRequest: jest.Mock;
        let mockPrepareBinaryData: jest.Mock;

        beforeEach(() => {
                textToImage = new PicsartTextToImage();
                
                // Setup mock HTTP request
                mockHttpRequest = jest.fn();
                mockPrepareBinaryData = jest.fn().mockResolvedValue({
                        data: Buffer.from('mock-image-data'),
                        mimeType: 'image/png',
                        fileName: 'generated.png',
                });

                // Create mock execute functions
                mockExecuteFunctions = {
                        getInputData: jest.fn().mockReturnValue([{ json: {} }]),
                        getNodeParameter: jest.fn(),
                        getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
                        helpers: {
                                httpRequest: mockHttpRequest,
                                prepareBinaryData: mockPrepareBinaryData,
                        },
                        getNode: jest.fn().mockReturnValue({ name: 'PicsartTextToImage' }),
                        continueOnFail: jest.fn().mockReturnValue(false),
                } as unknown as IExecuteFunctions;
        });

        afterEach(() => {
                jest.clearAllMocks();
        });

        // ===========================
        // BASIC FUNCTIONALITY TESTS
        // ===========================

        describe('Basic Functionality', () => {
                test('should successfully generate a single image with valid inputs', async () => {
                        // Setup mock parameters
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A beautiful sunset over mountains') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        // Mock balance check
                        mockHttpRequest.mockResolvedValueOnce({
                                data: { balance: 1000, credits: 1000 },
                        });

                        // Mock initial generation request
                        mockHttpRequest.mockResolvedValueOnce({
                                inference_id: 'test-inference-123',
                        });

                        // Mock polling request (success on first attempt)
                        mockHttpRequest.mockResolvedValueOnce({
                                status: 'success',
                                data: {
                                        images: [
                                                {
                                                        id: 'img-123',
                                                        url: 'https://example.com/image.png',
                                                },
                                        ],
                                },
                        });

                        // Mock image download
                        mockHttpRequest.mockResolvedValueOnce(Buffer.from('image-data'));

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result).toHaveLength(1);
                        expect(result[0]).toHaveLength(1);
                        expect(result[0][0]).toHaveProperty('binary');
                        expect(result[0][0]).toHaveProperty('json');
                        expect(result[0][0].json).toMatchObject({
                                prompt: 'A beautiful sunset over mountains',
                                inferenceId: 'test-inference-123',
                        });
                        expect(mockHttpRequest).toHaveBeenCalledTimes(4); // balance + generate + poll + download
                });

                test('should generate multiple images when count > 1', async () => {
                        // Setup mock parameters for 3 images
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A cat') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(3) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        // Mock balance check
                        mockHttpRequest.mockResolvedValueOnce({
                                data: { balance: 1000 },
                        });

                        // Mock initial generation request
                        mockHttpRequest.mockResolvedValueOnce({
                                inference_id: 'test-inference-123',
                        });

                        // Mock polling request with 3 images
                        mockHttpRequest.mockResolvedValueOnce({
                                status: 'success',
                                data: {
                                        images: [
                                                { id: 'img-1', url: 'https://example.com/image1.png' },
                                                { id: 'img-2', url: 'https://example.com/image2.png' },
                                                { id: 'img-3', url: 'https://example.com/image3.png' },
                                        ],
                                },
                        });

                        // Mock image downloads
                        mockHttpRequest.mockResolvedValue(Buffer.from('image-data'));

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result).toHaveLength(1);
                        expect(result[0]).toHaveLength(3); // 3 separate output items
                        expect(mockHttpRequest).toHaveBeenCalledTimes(6); // balance + generate + poll + 3 downloads
                });

                test('should include negative prompt when provided', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A portrait') // prompt
                                .mockReturnValueOnce('blurry, distorted') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Astronaut_Riding_a_Horse_Hiroshige_%28SD3.5%29.webp' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download


			const result = await textToImage.execute.call(mockExecuteFunctions);

			// Check that negative_prompt was included in the request
			const generateCall = mockHttpRequest.mock.calls[1];
			expect(generateCall[0].body).toHaveProperty('negative_prompt', 'blurry, distorted');
			expect(result[0]).toHaveLength(1);
                });
        });

        // ===========================
        // INPUT VALIDATION TESTS
        // ===========================

        describe('Input Validation', () => {
                test('should throw error when prompt is empty', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('') // empty prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Prompt is required and cannot be empty');
                });

                test('should throw error when prompt is only whitespace', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('   ') // whitespace prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Prompt is required and cannot be empty');
                });

                test('should throw error when count is less than 1', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A cat') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(0) // invalid count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Number of images must be between 1 and 10');
                });

                test('should throw error when count is greater than 10', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A cat') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(11) // invalid count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Number of images must be between 1 and 10');
                });

                test('should throw error when width is invalid', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A cat') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(600) // invalid width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Width must be 512, 768, or 1024 pixels');
                });

                test('should throw error when height is invalid', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('A cat') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(256) // invalid height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Height must be 512, 768, or 1024 pixels');
                });
        });

        // ===========================
        // CONFIGURATION OPTIONS TESTS
        // ===========================

        describe('Configuration Options', () => {
                const setupMocksForSuccess = () => {
                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://miro.medium.com/v2/resize:fit:2000/1*ZWeac4nAiJ01kDgr_raEOA.png' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download
                };

                test('should accept 512px dimensions', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        setupMocksForSuccess();

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0][0].json.dimensions).toEqual({ width: 512, height: 512 });
                });

                test('should accept 768px dimensions', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(768) // width
                                .mockReturnValueOnce(768) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        setupMocksForSuccess();

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0][0].json.dimensions).toEqual({ width: 768, height: 768 });
                });

                test('should accept 1024px dimensions', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(1024) // width
                                .mockReturnValueOnce(1024) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        setupMocksForSuccess();

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0][0].json.dimensions).toEqual({ width: 1024, height: 1024 });
                });

                test('should handle mixed dimensions (512x1024)', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(1024) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        setupMocksForSuccess();

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0][0].json.dimensions).toEqual({ width: 512, height: 1024 });
                });

                test('should generate exactly 5 images when count is 5', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(5) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: {
                                                images: Array.from({ length: 5 }, (_, i) => ({
                                                        id: `img-${i}`,
                                                        url: `https://www.learningcontainer.com/wp-content/uploads/2024/07/Sample-png-Image-for-Testing-1280x720.webp`,
                                                })),
                                        },
                                })
                                .mockResolvedValue(Buffer.from('image')); // downloads

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0]).toHaveLength(5);
                });

                test('should generate exactly 10 images when count is 10', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(10) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: {
                                                images: Array.from({ length: 10 }, (_, i) => ({
                                                        id: `img-${i}`,
                                                        url: `https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Example_image.svg/600px-Example_image.svg.png?20120902142711`,
                                                })),
                                        },
                                })
                                .mockResolvedValue(Buffer.from('image')); // downloads

                        const result = await textToImage.execute.call(mockExecuteFunctions);
                        expect(result[0]).toHaveLength(10);
                });
        });

        // ===========================
        // API INTEGRATION TESTS
        // ===========================

        describe('API Integration', () => {
                test('should use correct API endpoints', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://lh7-rt.googleusercontent.com/docsz/AD_4nXeqMf_WiC3Gh3AVCdB66PIRUzGq94JL9oJunQ6SROzgM6bNNMP5C_qxkUxGor_uPnHUkao1JXO_Tq7VLPf7PVizEJL2mh_h6hldAd0pUXJTpCN4KBEHUYAfxpkL14JaV8xb1Z5EY5qzALarUhYkiW4KTNA2?key=mgJ7c4z65pHVu05slr5ibw' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        await textToImage.execute.call(mockExecuteFunctions);

                        const balanceCall = mockHttpRequest.mock.calls[0][0];
                        const generateCall = mockHttpRequest.mock.calls[1][0];

                        expect(balanceCall.url).toBe('https://genai-api.picsart.io/v1/balance');
                        expect(generateCall.url).toBe('https://genai-api.picsart.io/v1/text2image');
                });

                test('should include API key in all requests', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://pub.mdpi-res.com/applsci/applsci-15-07421/article_deploy/html/images/applsci-15-07421-g001.png?1751447803' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        await textToImage.execute.call(mockExecuteFunctions);

                        // Check all API calls have the API key
                        for (let i = 0; i < 3; i++) {
                                const call = mockHttpRequest.mock.calls[i][0];
                                if (call.headers) {
                                        expect(call.headers['x-picsart-api-key']).toBe('test-api-key');
                                }
                        }
                });

                test('should send correct request body for generation', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Beautiful landscape') // prompt
                                .mockReturnValueOnce('blurry') // negative_prompt
                                .mockReturnValueOnce(2) // count
                                .mockReturnValueOnce(768) // width
                                .mockReturnValueOnce(1024) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: {
                                                images: [
                                                        { id: '1', url: 'http://example.com/img1.png' },
                                                        { id: '2', url: 'http://example.com/img2.png' },
                                                ],
                                        },
                                })
                                .mockResolvedValue(Buffer.from('image')); // downloads

                        await textToImage.execute.call(mockExecuteFunctions);

                        const generateCall = mockHttpRequest.mock.calls[1][0];
                        expect(generateCall.body).toEqual({
                                prompt: 'Beautiful landscape',
                                negative_prompt: 'blurry',
                                width: 768,
                                height: 1024,
                                count: 2,
                        });
                });
        });

        // ===========================
        // ERROR HANDLING TESTS
        // ===========================

        describe('Error Handling', () => {
                test('should throw error when API key is missing', async () => {
                        (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue({ apiKey: '' });
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Invalid API key');
                });

                test('should throw error when balance check fails (401)', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockRejectedValueOnce(new Error('Unauthorized'));

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Failed to check balance');
                });

                test('should throw error when insufficient balance', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockResolvedValueOnce({ data: { balance: 0 } }); // no balance
                        mockHttpRequest.mockRejectedValueOnce({
                                response: {
                                        status: 402,
                                        data: { detail: 'Insufficient balance' },
                                },
                        });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow();
                });

                test('should throw error on API 400 error', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockResolvedValueOnce({ data: { balance: 1000 } }); // balance ok
                        mockHttpRequest.mockRejectedValueOnce({
                                response: {
                                        status: 400,
                                        data: { detail: 'Invalid parameters' },
                                },
                        });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow();
                });

                test('should throw error on API 429 rate limit', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockResolvedValueOnce({ data: { balance: 1000 } }); // balance ok
                        mockHttpRequest.mockRejectedValueOnce({
                                response: {
                                        status: 429,
                                        data: { detail: 'Rate limit exceeded' },
                                },
                                message: 'Rate limit exceeded',
                        });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow();
                });

                test('should throw error on API 500 internal error', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockResolvedValueOnce({ data: { balance: 1000 } }); // balance ok
                        mockHttpRequest.mockRejectedValueOnce({
                                response: {
                                        status: 500,
                                        data: { detail: 'Internal server error' },
                                },
                        });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow();
                });

                test('should throw error when no inference_id returned', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest.mockResolvedValueOnce({ data: { balance: 1000 } }); // balance ok
                        mockHttpRequest.mockResolvedValueOnce({}); // no inference_id

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('No inference ID received from API');
                });

                test('should throw error when image download fails', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://miro.medium.com/v2/resize:fit:1400/1*UVRXalcyUsRcO-Nf6gnuBA.png' }] },
                                })
                                .mockRejectedValueOnce(new Error('Network error')); // download fails

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Failed to download generated image');
                });
        });

        // ===========================
        // POLLING MECHANISM TESTS
        // ===========================

        describe('Polling Mechanism', () => {
                test('should successfully poll and get result on first attempt', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll - immediate success
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://blog.segmind.com/content/images/size/w1200/2023/10/repl.png' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result[0]).toHaveLength(1);
                        expect(mockHttpRequest).toHaveBeenCalledTimes(4); // Only 1 poll attempt
                });

                test('should poll multiple times until success', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ status: 'processing' }) // poll 1 - processing
                                .mockResolvedValueOnce({ status: 'processing' }) // poll 2 - still processing
                                .mockResolvedValueOnce({ // poll 3 - success
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://i.ytimg.com/vi/f0igz-skLUY/maxresdefault.jpg' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result[0]).toHaveLength(1);
                        expect(mockHttpRequest).toHaveBeenCalledTimes(6); // balance + generate + 3 polls + download
                }, 15000); // Increase timeout for this test

                test('should throw error when polling times out', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(6); // short polling_timeout for test

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValue({ status: 'processing' }); // always processing

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('timed out');
                }, 15000);

                test('should throw error when polling returns failed status', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll - failed
                                        status: 'failed',
                                        message: 'Generation failed due to content policy',
                                });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Image generation failed');
                });

                test('should throw error when polling returns error status', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll - error
                                        status: 'error',
                                        message: 'Internal processing error',
                                });

                        await expect(textToImage.execute.call(mockExecuteFunctions))
                                .rejects
                                .toThrow('Image generation failed');
                });
        });

        // ===========================
        // EDGE CASES TESTS
        // ===========================

        describe('Edge Cases', () => {
                test('should handle very long prompts', async () => {
                        const longPrompt = 'A '.repeat(500) + 'beautiful landscape';
                        
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce(longPrompt) // very long prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://i.ytimg.com/vi/0zO_CU1UzLo/maxresdefault.jpg?sqp=-oaymwEmCIAKENAF8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGGUgZShlMA8=&rs=AOn4CLB1_PtrcyveztJvi6-IegmTn244uw' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result[0]).toHaveLength(1);
                        const generateCall = mockHttpRequest.mock.calls[1][0];
                        expect(generateCall.body.prompt.length).toBeGreaterThan(1000);
                });

                test('should handle special characters in prompts', async () => {
                        const specialPrompt = 'A cat with "quotes" & special <chars> | symbols @ #';
                        
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce(specialPrompt) // prompt with special chars
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Ai_training_compute_doubling_v2.png' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result[0]).toHaveLength(1);
                        const generateCall = mockHttpRequest.mock.calls[1][0];
                        expect(generateCall.body.prompt).toBe(specialPrompt);
                });

                test('should handle prompts with leading/trailing whitespace', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('  A cat with spaces  ') // prompt with whitespace
                                .mockReturnValueOnce('  negative  ') // negative_prompt with whitespace
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://substackcdn.com/image/fetch/$s_!8Geo!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F739e9e32-34ae-46ee-8e8b-00417dd09fb7_2452x1313.png' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

			const result = await textToImage.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			const generateCall = mockHttpRequest.mock.calls[1][0];
			expect(generateCall.body.prompt).toBe('A cat with spaces'); // trimmed
			expect(generateCall.body.negative_prompt).toBe('negative'); // trimmed
                });

                test('should not include negative_prompt in request when empty', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // empty negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: { images: [{ id: '1', url: 'https://i.ytimg.com/vi/H7khop1YbZ4/maxresdefault.jpg' }] },
                                })
                                .mockResolvedValueOnce(Buffer.from('image')); // download

                        await textToImage.execute.call(mockExecuteFunctions);

                        const generateCall = mockHttpRequest.mock.calls[1][0];
                        expect(generateCall.body).not.toHaveProperty('negative_prompt');
                });

                test('should handle continueOnFail mode', async () => {
                        (mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('') // empty prompt - will cause error
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(1) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result).toHaveLength(1);
                        expect(result[0]).toHaveLength(1);
                        expect(result[0][0].json).toHaveProperty('error');
                        expect(result[0][0].json.error).toContain('Prompt is required');
                });
        });

        // ===========================
        // MULTIPLE OUTPUT TESTS
        // ===========================

        describe('Multiple Outputs', () => {
                test('should return separate output items for each image', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(3) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: {
                                                images: [
                                                        { id: 'img-1', url: 'http://example.com/img1.png' },
                                                        { id: 'img-2', url: 'http://example.com/img2.png' },
                                                        { id: 'img-3', url: 'http://example.com/img3.png' },
                                                ],
                                        },
                                })
                                .mockResolvedValue(Buffer.from('image')); // downloads

                        const result = await textToImage.execute.call(mockExecuteFunctions);

                        expect(result[0]).toHaveLength(3);
                        
                        // Verify each output has unique image ID
                        const imageIds = result[0].map(item => item.json.imageId);
                        expect(new Set(imageIds).size).toBe(3); // All unique
                        
                        // Verify each has binary data
                        result[0].forEach(item => {
                                expect(item).toHaveProperty('binary');
                                expect(item).toHaveProperty('json');
                        });
                });

                test('should include credits info in all output items', async () => {
                        (mockExecuteFunctions.getNodeParameter as jest.Mock)
                                .mockReturnValueOnce('Test') // prompt
                                .mockReturnValueOnce('') // negative_prompt
                                .mockReturnValueOnce(2) // count
                                .mockReturnValueOnce(512) // width
                                .mockReturnValueOnce(512) // height
                                .mockReturnValueOnce(120); // polling_timeout

                        mockHttpRequest
                                .mockResolvedValueOnce({ data: { balance: 1000, credits: 1000 } }) // balance
                                .mockResolvedValueOnce({ inference_id: 'test-123' }) // generate
                                .mockResolvedValueOnce({ // poll
                                        status: 'success',
                                        data: {
                                                images: [
                                                        { id: 'img-1', url: 'http://example.com/img1.png' },
                                                        { id: 'img-2', url: 'http://example.com/img2.png' },
                                                ],
                                        },
                                })
                                .mockResolvedValue(Buffer.from('image')); // downloads

                        const result = await textToImage.execute.call(mockExecuteFunctions);

			result[0].forEach(item => {
				expect(item.json.credits).toBeDefined();
				const credits = item.json.credits as any;
				expect(credits.balance).toBe(1000);
			});
                });
        });

        // ===========================
        // NODE METADATA TESTS
        // ===========================

        describe('Node Metadata', () => {
                test('should have correct node description', () => {
                        expect(textToImage.description).toBeDefined();
                        expect(textToImage.description.displayName).toBe('Picsart Text to Image');
                        expect(textToImage.description.name).toBe('picsartTextToImage');
                        expect(textToImage.description.description).toContain('Generate AI images');
                });

                test('should require picsartApi credentials', () => {
                        const credentials = textToImage.description.credentials;
                        expect(credentials).toBeDefined();
                        expect(credentials).toHaveLength(1);
                        expect(credentials![0].name).toBe('picsartApi');
                        expect(credentials![0].required).toBe(true);
                });

                test('should have all required properties defined', () => {
                        const properties = textToImage.description.properties;
                        expect(properties).toBeDefined();
                        
                        const propertyNames = properties.map(p => p.name);
                        expect(propertyNames).toContain('prompt');
                        expect(propertyNames).toContain('negative_prompt');
                        expect(propertyNames).toContain('count');
                        expect(propertyNames).toContain('width');
                        expect(propertyNames).toContain('height');
                        expect(propertyNames).toContain('polling_timeout');
                });

                test('prompt property should be required', () => {
                        const promptProp = textToImage.description.properties.find(p => p.name === 'prompt');
                        expect(promptProp).toBeDefined();
                        expect(promptProp!.required).toBe(true);
                });

                test('should be usable as a tool', () => {
                        expect(textToImage.description.usableAsTool).toBe(true);
                });
        });
});