/* eslint-disable prettier/prettier */
// import { getToken } from "./auth.functions";



// const apiURL = 'https://api.pedeapetroleum.com' || 'http://127.0.0.1:3333';
// const apiURL = 'http://127.0.0.1:3333';

/**
 * Makes an async GET request to the provided endpoint.
 *
 * @param endpoint - The endpoint to make the GET request to.
 * @returns A Promise that resolves with the JSON response body on success, or rejects with an error on failure.
 */
export async function getRequest(endpoint: string): Promise<any> {
    const url = prepareEndpoint(endpoint);
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: prepareHeaders(),
        });
        return await response.json();
        // response.json().then(res => {
        // })
    } catch (error: any) {
        handleError(error);
        return undefined;
    }
};

/**
 * Makes an async POST request to the provided endpoint with the given data.
 *
 * @param endpoint - The endpoint to make the POST request to.
 * @param data - The data to send in the POST request body.
 * @returns A Promise that resolves with the JSON response body on success, or rejects with an error on failure.
 */
export async function postRequest(endpoint: string, data: any): Promise<any> {
    const url = prepareEndpoint(endpoint);
    const modifiedRequest = modifyRequest('create', data);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: prepareHeaders(),
            body: JSON.stringify(modifiedRequest),
        });
        return await response.json();
    } catch (error: any) {
        handleError(error);
        return undefined;
    }
};


/**
 * Makes an async PUT request to the provided endpoint with the given data.
 *
 * @param endpoint - The endpoint to make the PUT request to.
 * @param data - The data to send in the PUT request body.
 * @returns A Promise that resolves with the JSON response body on success, or rejects with an error on failure.
 */
export async function putRequest(endpoint: string, data: any): Promise<any> {
    const url = prepareEndpoint(endpoint);
    const modifiedRequest = modifyRequest('update', data);
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: prepareHeaders(),
            body: JSON.stringify(modifiedRequest),
        });
        return await response.json();
    } catch (error: any) {
        handleError(error);
        return undefined;
    }
};


/**
 * Makes an async PATCH request to the provided endpoint with the given data.
 *
 * @param data - The data to send in the PATCH request body.
 * @returns A Promise that resolves with the JSON response body on success, or rejects with an error on failure.
 */
export async function patchRequest(endpoint: string, data: any,): Promise<any> {
    const url = prepareEndpoint(endpoint);
    const modifiedRequest = modifyRequest('update', data);
    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: prepareHeaders(),
            body: JSON.stringify(modifiedRequest),
        });
        return await response.json();
    } catch (error: any) {
        handleError(error);
        return undefined;
    }
};

/**
 * Makes an async DELETE request to the provided endpoint.
 *
 * @param endpoint - The endpoint to make the DELETE request to.
 * @returns A Promise that resolves with the JSON response body on success, or rejects with an error on failure.
 */
export async function deleteRequest(endpoint: string): Promise<any> {
    const url = prepareEndpoint(endpoint);

    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: prepareHeaders(),
        });
        return await response.json();
    } catch (error: any) {
        handleError(error);
        return undefined;
    }
}


/********************************************************* END OF REQUESTS *********************************************************/


/**
 * Logs an error message to the console.
 *
 * @param error - The error object containing the error message.
 */
const handleError = (error: Error) => {
    console.error(error);

    console.error("Error occurred:", error.message);
};

/**
 * Prepares the API endpoint URL by prepending the base URL and ensuring
 * the endpoint starts with '/'.
 *
 * @param endpoint - The API endpoint to call
 * @returns The full URL for the endpoint
 */
function prepareEndpoint(endpoint: string) {
    let modifiedEndpoint = endpoint;
    if (modifiedEndpoint.charAt(0) === "/") {
        modifiedEndpoint = modifiedEndpoint.substring(1);
    }
    return `${modifiedEndpoint}`;
}


/**
 * Prepares Headers to be used in http calls
 *
 * @return Headers
 */
function prepareHeaders(): any {

    // const currency = country.currency || 'UNKNOWN';
    const headers = {
        "Content-Type": "Application/json",
        // "BEARER": getToken(),
    }
    return headers;
}

type requestTypes = 'create' | 'update' | 'read' | 'delete';
function modifyRequest(type: requestTypes, request: any) {

    // request.organizationId = organization.id || null;

    // if (type === 'create') {
    //     request.createdBy = user.email;
    //     // request.updatedBy = user.id;
    // } else if (type === 'update') {
    //     request.updatedBy = user.email;

    // } else if (type === 'delete') {
    //     request.deletedBy = user.email;
    // }
    return request;
}

// function handleNotification()