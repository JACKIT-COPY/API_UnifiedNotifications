/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { getRequest } from '../http';
import { phoneNumberWithCountryCode, prepareMessage } from './lancola-sms.functions';
import { SMSInterface } from './sms.interface';



@Injectable()
export class LancolaSmsService {


    async sendSMS(payload: SMSInterface) {
        return new Promise<any>(async (resolve, reject) => {
            const phoneNumber = phoneNumberWithCountryCode({ phoneNumber: payload.phone, countryCode: '254' });
            payload.phone = phoneNumber;
            const finalURL = prepareMessage(payload);


            getRequest(finalURL).then((response) => {
console.log(response);

                resolve(response);
            });
        })

    }



}
