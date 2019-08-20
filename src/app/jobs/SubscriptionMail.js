import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    Mail.senddMail({
      to: `${meetup.User.email} <${meetup.User.name}>`,
      subject: 'Inscrição no seu evento',
      template: 'subscription',
      context: {
        organizer: meetup.User.name,
        meetup: meetup.title,
        subscriber: user.name,
        subscriberEmail: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
