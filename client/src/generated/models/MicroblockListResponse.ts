/* tslint:disable */
/* eslint-disable */
/**
 * Stacks Blockchain API
 * Welcome to the API reference overview for the <a href=\"https://docs.hiro.so/get-started/stacks-blockchain-api\">Stacks Blockchain API</a>.  <a href=\"https://hirosystems.github.io/stacks-blockchain-api/collection.json\" download=\"stacks-api-collection.json\">Download Postman collection</a> 
 *
 * The version of the OpenAPI document: STACKS_API_VERSION
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import {
    Microblock,
    MicroblockFromJSON,
    MicroblockFromJSONTyped,
    MicroblockToJSON,
} from './';

/**
 * GET request that returns microblocks
 * @export
 * @interface MicroblockListResponse
 */
export interface MicroblockListResponse {
    /**
     * The number of microblocks to return
     * @type {number}
     * @memberof MicroblockListResponse
     */
    limit: number;
    /**
     * The number to microblocks to skip (starting at `0`)
     * @type {number}
     * @memberof MicroblockListResponse
     */
    offset: number;
    /**
     * The number of microblocks available
     * @type {number}
     * @memberof MicroblockListResponse
     */
    total: number;
    /**
     * 
     * @type {Array<Microblock>}
     * @memberof MicroblockListResponse
     */
    results: Array<Microblock>;
}

export function MicroblockListResponseFromJSON(json: any): MicroblockListResponse {
    return MicroblockListResponseFromJSONTyped(json, false);
}

export function MicroblockListResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): MicroblockListResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'limit': json['limit'],
        'offset': json['offset'],
        'total': json['total'],
        'results': ((json['results'] as Array<any>).map(MicroblockFromJSON)),
    };
}

export function MicroblockListResponseToJSON(value?: MicroblockListResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'limit': value.limit,
        'offset': value.offset,
        'total': value.total,
        'results': ((value.results as Array<any>).map(MicroblockToJSON)),
    };
}
