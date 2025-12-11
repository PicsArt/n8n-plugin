import type { INodeProperties } from 'n8n-workflow';

export const removeBgProperties: INodeProperties[] = [
    {
        displayName: 'Image URL',
        name: 'image_url',
        type: 'string',
        default: '',
        placeholder: '{{$json["image_url"]}}',
        description: 'URL image for processing',
        required: true,
        displayOptions: {
            show: {
                resource: ['image'],
                operation: ['removeBackground'],
            },
        },
    },
    {
        displayName: 'Background Image URL',
        name: 'bg_image_url',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['image'],
                operation: ['removeBackground'],
            },
        },
    },
    {
        displayName: 'Background Color',
        name: 'bg_color',
        type: 'color',
        default: '',
        displayOptions: {
            show: {
                resource: ['image'],
                operation: ['removeBackground'],
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
                resource: ['image'],
                operation: ['removeBackground'],
            },
        },
    },

]