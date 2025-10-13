/* eslint-disable prettier/prettier */
import { LANCOLA_SMS_APIURL, LANCOLA_SMS_apiKey, LANCOLA_SMS_partnerID, LANCOLA_SMS_shortCode } from "../../lancola-sms.config";
import { SMSInterface } from "./sms.interface";

export function prepareMessage(payload: SMSInterface) {
    const { phone, message } = payload;
    const preparedMessage = `${LANCOLA_SMS_APIURL}${LANCOLA_SMS_apiKey}&partnerID=${LANCOLA_SMS_partnerID}&message=${encodeURIComponent(message)}&shortcode=${LANCOLA_SMS_shortCode}&mobile=${phone}`;
    return preparedMessage;
}

/* eslint-disable prettier/prettier */


/**
 * Formats a phone number with a country code.
 *
 * @param payload - An object containing the phone number and country code.
 * @param payload.phoneNumber - The phone number to format.
 * @param payload.countryCode - The country code to use.
 * @returns The formatted phone number with the country code.
 */
export function phoneNumberWithCountryCode(payload: {
    phoneNumber: string;
    countryCode: string;
}): string {
    const { phoneNumber, countryCode } = payload;
    return formatPhoneNumber({ phone: phoneNumber, countryCode });
}


function formatPhoneNumber(payload: { phone: string, countryCode: string }): string {
    const { phone, countryCode } = payload;
    let code = countryCode;
    if (code.startsWith('+')) {
        code = code.replace('+', '');
    }

    let mobile: string = phone.toString().replace(/\s+/g, ''); // Remove spaces

    if (mobile.startsWith('0')) {
        mobile = `${code}${mobile.slice(1)}`;
    } else if (mobile.startsWith('+')) {
        mobile = mobile.replace('+', '');
    } else {
        mobile = `${code}${mobile}`;
    }
    return mobile;
}