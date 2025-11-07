/**
 * @fileoverview User input validation for registration using Joi.
 */

import Joi from 'joi';

/**
 * Validates registration input using Joi schema rules.
 * <br><br>
 * This function checks whether the provided registration data (username and password) conforms to predefined constraints. <br>
 * It ensures the username is alphanumeric, between 5 and 25 characters, and the password is at least 6 characters long.
 * <br><br>
 * Joi error messages are customized for better user feedback.
 *
 * @function validateRegistrationInput
 * @param {Object} data - The input data to validate.
 * @param {string} data.username - The desired username (alphanumeric, 5–25 characters).
 * @param {string} data.password - The desired password (min 6 characters).
 * @returns {Joi.ValidationResult} The result of the validation, including `error` and `value`.
 */
export function validateRegistrationInput(data) {
    const schema = Joi.object({
        username: Joi.string()
            .alphanum()
            .min(5)
            .max(25)
            .required()
            .messages({
                "string.base": 'Username must be a string',
                "string.alphanum": 'Username must contain only alphanumeric characters',
                "string.min": 'Username must be at least 5 characters long',
                "string.max": 'Username must be at most 25 characters long',
                "any.required": 'Username is required',
            }),
        password: Joi.string().
            min(6)
            .required()
            .messages({
                "string.base": 'Password must be a string',
                "string.min": 'Password must be at least 6 characters long',
                "any.required": 'Password is required',
            }),
    });

    return schema.validate(data);
}
