// send(message, env) => Promise<{ providerRef: string }>
//   message: { to, channel: 'email'|'sms', templateId, data }
// Every call is logged to notification_log regardless of provider —
// see notify() in events.js, which is what endpoints actually call.

export class NotificationProviderInterface {
  async send(_message, _env) { throw new Error('Not implemented'); }
}
