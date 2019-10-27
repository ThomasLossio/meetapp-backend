import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    Mail.sendMail({
      to: `${meetup.user.email} <${meetup.user.name}>`,
      subject: 'Inscrição no seu evento',
      template: 'subscription',
      context: {
        organizer: meetup.user.name,
        meetup: meetup.title,
        subscriber: user.name,
        subscriberEmail: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
