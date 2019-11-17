import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

import CreateSubscriptionError from '../errors/StatusCodeErrors';

class CreateSubscriptionService {
  async run({ user_id, meetup_id }) {
    const user = await User.findByPk(user_id);

    const meetup = await Meetup.findByPk(meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (meetup.user_id === user_id) {
      throw new CreateSubscriptionError(
        400,
        'You cannot subscribe for your own meetup'
      );
    }

    if (meetup.past) {
      throw new CreateSubscriptionError(400, 'This meetup has passed');
    }

    const checkSubscribed = await Subscription.findOne({
      where: { user_id, meetup_id },
    });

    if (checkSubscribed) {
      throw new CreateSubscriptionError(
        400,
        'You cannot subscribe on a meetup you already has subscribed'
      );
    }

    const checkDate = await Subscription.findOne({
      where: { user_id },
      include: [
        {
          model: Meetup,
          where: { date_and_hour: meetup.date_and_hour },
        },
      ],
    });

    if (checkDate) {
      throw new CreateSubscriptionError(
        400,
        'You are already subscribed in another meetup at the same time'
      );
    }

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return subscription;
  }
}

export default new CreateSubscriptionService();
