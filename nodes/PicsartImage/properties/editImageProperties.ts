import type { INodeProperties } from 'n8n-workflow';

export const editImageProperties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary data of the image to edit',
		hint: 'The field typically comes from HTTP Request, Read Binary File, or previous processing nodes',
		displayOptions: {
			show: {
				resource: ['DATA'],
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		placeholder: '{{$json["image_url"]}}',
		description: 'URL of the image to edit',
		displayOptions: {
			show: {
				resource: ['Image URL'],
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'JPG',
		description: 'Output image format',
		options: [
			{ name: 'JPG', value: 'JPG' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'WEBP', value: 'WEBP' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: '',
		description: 'For crop mode, the outcome image will be center-cropped. For resize mode, the smallest size will be fitted to preserve proportion.',
		options: [
			{ name: 'None', value: '' },
			{ name: 'Resize', value: 'resize' },
			{ name: 'Crop', value: 'crop' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'number',
		default: 0,
		description: 'When defined, this parameter overrides and applies the value for both width and height. Set to 0 to disable.',
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		default: 0,
		description: 'Width of outcome image. Set to 0 to keep original width.',
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		default: 0,
		description: 'Height of outcome image. Set to 0 to keep original height.',
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Crop X',
		name: 'crop_x',
		type: 'number',
		default: 0,
		description: 'X coordinate for crop anchor point (center of crop area). Set to 0 to use crop_anchor instead.',
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Crop Y',
		name: 'crop_y',
		type: 'number',
		default: 0,
		description: 'Y coordinate for crop anchor point (center of crop area). Set to 0 to use crop_anchor instead.',
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Crop Anchor',
		name: 'crop_anchor',
		type: 'options',
		default: 'center',
		description: 'Position to anchor the crop when crop_x and crop_y are not provided',
		options: [
			{ name: 'Bottom Left', value: 'bottom-left' },
			{ name: 'Bottom Right', value: 'bottom-right' },
			{ name: 'Center', value: 'center' },
			{ name: 'Top Left', value: 'top-left' },
			{ name: 'Top Right', value: 'top-right' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Flip',
		name: 'flip',
		type: 'options',
		default: '',
		description: 'Choose a way to flip the image',
		options: [
			{ name: 'None', value: '' },
			{ name: 'Horizontal', value: 'horizontal' },
			{ name: 'Vertical', value: 'vertical' },
		],
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Rotate',
		name: 'rotate',
		type: 'number',
		default: 0,
		description: 'Rotate the image from -180 to +180 degrees',
		typeOptions: {
			minValue: -180,
			maxValue: 180,
		},
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Perspective Horizontal',
		name: 'perspective_horizontal',
		type: 'number',
		default: 0,
		description: 'The horizontal perspective (-45 to 45)',
		typeOptions: {
			minValue: -45,
			maxValue: 45,
		},
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Perspective Vertical',
		name: 'perspective_vertical',
		type: 'number',
		default: 0,
		description: 'The vertical perspective (-45 to 45)',
		typeOptions: {
			minValue: -45,
			maxValue: 45,
		},
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'number',
		default: 90,
		description: 'Level of accuracy of the image processing (10-100). Higher quality = larger file size.',
		typeOptions: {
			minValue: 10,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				operation: ['Edit Image'],
			},
		},
	},
];
