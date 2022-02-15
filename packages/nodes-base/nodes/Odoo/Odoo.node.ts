import { IExecuteFunctions } from 'n8n-core';
import { OptionsWithUri } from 'request';

import {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';

import {
	contactDescription,
	contactOperations,
	customResourceDescription,
	customResourceOperations,
	noteDescription,
	noteOperations,
	opportunityDescription,
	opportunityOperations,
} from './descriptions';

import {
	IOdooFilterOperations,
	odooCreate,
	odooDelete,
	odooGet,
	odooGetAll,
	odooGetModelFields,
	odooGetUserID,
	odooJSONRPCRequest,
	odooUpdate,
	processNameValueFields,
} from './GenericFunctions';

import { capitalCase } from 'change-case';
export class Odoo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Odoo',
		name: 'odoo',
		icon: 'file:odoo.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume Odoo API',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'Odoo',
			color: '#714B67',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'odooApi',
				required: true,
				testedBy: 'odooApiTest',
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				default: 'contact',
				noDataExpression: true,
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Custom Resource',
						value: 'custom',
						description: 'Only for advanced users! Use cautiously!',
					},
					{
						name: 'Note',
						value: 'note',
					},
					{
						name: 'Opportunity',
						value: 'opportunity',
					},
				],
				description: 'The resource to operate on',
			},

			...customResourceOperations,
			...customResourceDescription,
			...opportunityOperations,
			...opportunityDescription,
			...contactOperations,
			...contactDescription,
			...noteOperations,
			...noteDescription,
		],
	};

	methods = {
		loadOptions: {
			async getModelFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let resource;
				resource = this.getCurrentNodeParameter('resource') as string;
				if (resource === 'custom') {
					resource = this.getCurrentNodeParameter('customResource') as string;
				}

				const credentials = await this.getCredentials('odooApi');
				const url = credentials?.url as string;
				const username = credentials?.username as string;
				const password = credentials?.password as string;
				const db = (credentials?.db || url.split('//')[1].split('.')[0]) as string;
				const userID = await odooGetUserID.call(this, db, username, password, url);

				const responce = await odooGetModelFields.call(this, db, userID, password, resource, url);

				const options = Object.values(responce).map((field) => {
					const optionField = field as { [key: string]: string };
					return {
						name: capitalCase(optionField.name),
						value: optionField.name,
						// nodelinter-ignore-next-line
						description: `${optionField?.string}, type: ${optionField?.type} required: ${optionField?.required}`,
					};
				});

				return options.sort((a, b) => a.name?.localeCompare(b.name) || 0);
			},
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('odooApi');
				const url = credentials?.url as string;
				const username = credentials?.username as string;
				const password = credentials?.password as string;
				const db = (credentials?.db || url.split('//')[1].split('.')[0]) as string;
				const userID = await odooGetUserID.call(this, db, username, password, url);

				const body = {
					jsonrpc: '2.0',
					method: 'call',
					params: {
						service: 'object',
						method: 'execute',
						args: [
							db,
							userID,
							password,
							'ir.model',
							'search_read',
							[],
							['name', 'model', 'modules'],
						],
					},
					id: Math.floor(Math.random() * 100),
				};

				const responce = (await odooJSONRPCRequest.call(this, body, url)) as IDataObject[];

				const options = responce.map((model) => {
					return {
						name: model.name,
						value: model.model,
						description: `model: ${model.model}<br> modules: ${model.modules}`,
					};
				});
				return options as INodePropertyOptions[];
			},
			async getStates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('odooApi');
				const url = credentials?.url as string;
				const username = credentials?.username as string;
				const password = credentials?.password as string;
				const db = (credentials?.db || url.split('//')[1].split('.')[0]) as string;
				const userID = await odooGetUserID.call(this, db, username, password, url);

				const body = {
					jsonrpc: '2.0',
					method: 'call',
					params: {
						service: 'object',
						method: 'execute',
						args: [db, userID, password, 'res.country.state', 'search_read', [], ['id', 'name']],
					},
					id: Math.floor(Math.random() * 100),
				};

				const responce = (await odooJSONRPCRequest.call(this, body, url)) as IDataObject[];

				const options = responce.map((state) => {
					return {
						name: state.name as string,
						value: state.id,
					};
				});
				return options.sort((a, b) => a.name?.localeCompare(b.name) || 0) as INodePropertyOptions[];
			},
			async getCountries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('odooApi');
				const url = credentials?.url as string;
				const username = credentials?.username as string;
				const password = credentials?.password as string;
				const db = (credentials?.db || url.split('//')[1].split('.')[0]) as string;
				const userID = await odooGetUserID.call(this, db, username, password, url);

				const body = {
					jsonrpc: '2.0',
					method: 'call',
					params: {
						service: 'object',
						method: 'execute',
						args: [db, userID, password, 'res.country', 'search_read', [], ['id', 'name']],
					},
					id: Math.floor(Math.random() * 100),
				};

				const responce = (await odooJSONRPCRequest.call(this, body, url)) as IDataObject[];

				const options = responce.map((country) => {
					return {
						name: country.name as string,
						value: country.id,
					};
				});

				return options.sort((a, b) => a.name?.localeCompare(b.name) || 0) as INodePropertyOptions[];
			},
		},
		credentialTest: {
			async odooApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data;

				const body = {
					jsonrpc: '2.0',
					method: 'call',
					params: {
						service: 'common',
						method: 'login',
						args: [credentials?.db, credentials?.username, credentials?.password],
					},
					id: Math.floor(Math.random() * 100),
				};

				const options: OptionsWithUri = {
					headers: {
						'User-Agent': 'https://n8n.io',
						Connection: 'keep-alive',
						Accept: '*/*',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body,
					uri: `${(credentials?.url as string).replace(/\/$/, '')}/jsonrpc`,
					json: true,
				};
				try {
					const result = await this.helpers.request!(options);
					if (result.error || !result.result) {
						return {
							status: 'Error',
							message: `Credentials are not valid`,
						};
					} else if (result.error) {
						return {
							status: 'Error',
							message: `Credentials are not valid: ${result.error.data.message}`,
						};
					}
				} catch (error) {
					return {
						status: 'Error',
						message: `Settings are not valid: ${error}`,
					};
				}
				return {
					status: 'OK',
					message: 'Authentication successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let items = this.getInputData();
		items = JSON.parse(JSON.stringify(items));
		const returnData: IDataObject[] = [];
		let responseData;

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('odooApi');
		const url = (credentials?.url as string).replace(/\/$/, '');
		const username = credentials?.username as string;
		const password = credentials?.password as string;
		const db = (credentials?.db || url.split('//')[1].split('.')[0]) as string;
		const userID = await odooGetUserID.call(this, db, username, password, url);

		//----------------------------------------------------------------------
		//                            Main loop
		//----------------------------------------------------------------------

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'contact') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const name = this.getNodeParameter('contactName', i) as string;
						const fields: IDataObject = {
							name,
							...additionalFields,
						};
						responseData = await odooCreate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							fields,
						);
					}

					if (operation === 'delete') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						responseData = await odooDelete.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							contactId,
						);
					}

					if (operation === 'get') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						responseData = await odooGet.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							contactId,
							fields,
						);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const fields = this.getNodeParameter('options.fieldsList', i, {}) as IDataObject;
						if (returnAll) {
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined,
								fields,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined, // filters, only for custom resource
								fields,
								limit,
							);
						}
					}

					if (operation === 'update') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						responseData = await odooUpdate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							contactId,
							updateFields,
						);
					}
				}

				if (resource === 'custom') {
					const customResource = this.getNodeParameter('customResource', i) as string;
					if (operation === 'create') {
						const fields = this.getNodeParameter('fieldsToCreateOrUpdate', i) as IDataObject;
						responseData = await odooCreate.call(
							this,
							db,
							userID,
							password,
							customResource,
							operation,
							url,
							processNameValueFields(fields),
						);
					}

					if (operation === 'delete') {
						const customResourceId = this.getNodeParameter('customResourceId', i) as string;
						responseData = await odooDelete.call(
							this,
							db,
							userID,
							password,
							customResource,
							operation,
							url,
							customResourceId,
						);
					}

					if (operation === 'get') {
						const customResourceId = this.getNodeParameter('customResourceId', i) as string;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						responseData = await odooGet.call(
							this,
							db,
							userID,
							password,
							customResource,
							operation,
							url,
							customResourceId,
							fields,
						);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						const filter = this.getNodeParameter('filterRequest', i) as IOdooFilterOperations;
						if (returnAll) {
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								customResource,
								operation,
								url,
								filter,
								fields,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								customResource,
								operation,
								url,
								filter,
								fields,
								limit,
							);
						}
					}

					if (operation === 'update') {
						const customResourceId = this.getNodeParameter('customResourceId', i) as string;
						const fields = this.getNodeParameter('fieldsToCreateOrUpdate', i) as IDataObject;
						responseData = await odooUpdate.call(
							this,
							db,
							userID,
							password,
							customResource,
							operation,
							url,
							customResourceId,
							processNameValueFields(fields),
						);
					}
				}

				if (resource === 'note') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						responseData = await odooCreate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							additionalFields,
						);
					}

					if (operation === 'delete') {
						const noteId = this.getNodeParameter('noteId', i) as string;
						responseData = await odooDelete.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							noteId,
						);
					}

					if (operation === 'get') {
						const noteId = this.getNodeParameter('noteId', i) as string;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						responseData = await odooGet.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							noteId,
							fields,
						);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						if (returnAll) {
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined,
								fields,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined, // filters, only for custom resource
								fields,
								limit,
							);
						}
					}

					if (operation === 'update') {
						const noteId = this.getNodeParameter('noteId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						responseData = await odooUpdate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							noteId,
							updateFields,
						);
					}
				}

				if (resource === 'opportunity') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const name = this.getNodeParameter('opportunityName', i) as string;
						const fields: IDataObject = {
							name,
							...additionalFields,
						};
						responseData = await odooCreate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							fields,
						);
					}

					if (operation === 'delete') {
						const opportunityId = this.getNodeParameter('opportunityId', i) as string;
						responseData = await odooDelete.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							opportunityId,
						);
					}

					if (operation === 'get') {
						const opportunityId = this.getNodeParameter('opportunityId', i) as string;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						responseData = await odooGet.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							opportunityId,
							fields,
						);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const fields = this.getNodeParameter('fieldsList', i) as IDataObject;
						if (returnAll) {
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined,
								fields,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							responseData = await odooGetAll.call(
								this,
								db,
								userID,
								password,
								resource,
								operation,
								url,
								undefined, // filters, only for custom resource
								fields,
								limit,
							);
						}
					}

					if (operation === 'update') {
						const opportunityId = this.getNodeParameter('opportunityId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						responseData = await odooUpdate.call(
							this,
							db,
							userID,
							password,
							resource,
							operation,
							url,
							opportunityId,
							updateFields,
						);
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push.apply(returnData, responseData);
				} else if (responseData !== undefined) {
					returnData.push(responseData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as JsonObject).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}