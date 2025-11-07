/**
 * @fileoverview Helper utility functions for server operations.
 */

/**
 * Filters the fields of an object based on the provided list of field names.
 * @function filterFields
 * @param {Object} obj - The object to filter.
 * @param {Array<string>} fields - The list of field names to retain.
 * @returns {Object} A new object containing only the specified fields.
 */
export function filterFields(obj, fields) {
    if (!fields || !fields.length) return obj;
    return Object.fromEntries(fields.map(f => [f, obj[f]]).filter(([k, v]) => v !== undefined));
}

/**
 * Generates a random code string of specified size, prefixed with '#'.
 * @function generateCode
 * @param {number} size - The length of the random code to generate.
 * @returns {string} A random code string.
 */
export function generateCode(size) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '#';
    
    for (let i = 0; i < size; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    return code;
}