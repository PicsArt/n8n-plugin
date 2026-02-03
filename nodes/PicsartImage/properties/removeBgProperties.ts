import type { INodeProperties } from 'n8n-workflow';

export const removeBgProperties: INodeProperties[] = [
    {
        displayName: 'Input Binary Field',
        name: 'inputBinaryField',
        type: 'string',
        default: 'data',
        description: 'The name of the input field containing the binary data',
        hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
        displayOptions: {
            show: {
                resource: ['DATA'],
                operation: ['Remove Background'],
            },
        },
    },
    {
        displayName: 'Image URL',
        name: 'image_url',
        type: 'string',
        default: '',
        placeholder: '{{$json["image_url"]}}',
        description: 'URL image for processing',
        displayOptions: {
            show: {
                resource: ['Image URL'],
                operation: ['Remove Background'],
            },
        },
        modes: [
            {
                displayName: 'Upload Image',
                name: 'id',
                type: 'string',
                hint: 'Enter an ID',
                validation: [
                    {
                        type: 'regex',
                        properties: {
                            regex: '^[0-9]',
                            errorMessage: 'The ID must start with a number',
                        },
                    },
                ],
                placeholder: '12example',
                // How to use the ID in API call
                url: '=http://api-base-url.com/?id={{$value}}',
            },
            {
                displayName: 'URL',
                name: 'url',
                type: 'string',
                hint: 'Enter a URL',
                validation: [
                    {
                        type: 'regex',
                        properties: {
                            regex: '^http',
                            errorMessage: 'Invalid URL',
                        },
                    },
                ],
                placeholder: 'https://example.com/card/12example/',
                // How to get the ID from the URL
                extractValue: {
                    type: 'regex',
                    regex: 'example.com/card/([0-9]*.*)/',
                },
            },
        ],
    },
    {
        displayName: 'Background Type',
        name: 'backgroundType',
        type: 'options',
        options: [
        { name: 'Image', value: 'image' },
        { name: 'Color', value: 'color' },
        ],
        default: 'color',
        displayOptions: {
            show: {
                operation: ['Remove Background'],
            },
        },
    },
    
    // background image field
    {
        displayName: 'Background Image',
        name: 'backgroundImage',
        type: 'string',
        default: '',
        displayOptions: {
        show: {
                operation: ['Remove Background'],
            backgroundType: ['image'],
        },
        },
    },
    
    // background color field
    {
        displayName: 'Background Color',
        name: 'backgroundColor',
        type: 'color',
        default: '',
        displayOptions: {
        show: {
                operation: ['Remove Background'],
            backgroundType: ['color'],
        },
        },
    },
    {
        displayName: 'Format',
        name: 'format',
        type: 'options',
        default: 'PNG',
        noDataExpression: true,
        options: [
            { name: 'JPG', value: 'JPG' },
            { name: 'PNG', value: 'PNG' },
            { name: 'WEBP', value: 'WEBP' },
        ],
        displayOptions: {
            show: {
                resource: ['DATA', 'Image URL'],
                operation: ['Remove Background'],
            },
        },
    },

]