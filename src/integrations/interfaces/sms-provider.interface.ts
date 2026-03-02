import { SMSInterface } from '../lancola-sms/services/lancola-sms/sms.interface';

export interface ISmsProvider {
  /**
   * Send an SMS via the provider.
   * @param payload The SMS content (phone, message).
   * @param config The provider-specific configuration for the organization.
   * @returns The provider's response.
   */
  sendSMS(payload: SMSInterface, config: any): Promise<any>;
}
