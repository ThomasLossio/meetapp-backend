import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

import DeleteSubscriptionError from '../errors/StatusCodeErrors';

class DeleteSubscriptionService {
  async run({ subscription_id, user_id }) {
    const subscription = await Subscription.findByPk(subscription_id);

    if (!subscription) {
      throw new DeleteSubscriptionError(
        400,
        'This subscription does not exist'
      );
    }

    if (subscription.user_id !== user_id) {
      throw new DeleteSubscriptionError(400, 'This subscripiton is not yours');
    }

    const meetup = await Meetup.findByPk(subscription.meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (meetup.user.id === user_id) {
      throw new DeleteSubscriptionError(
        400,
        'You cannot unsubscribe for your own meetup'
      );
    }

    if (meetup.past) {
      throw new DeleteSubscriptionError(
        400,
        'This meetup has passed, you cannot unsubscribe it anymore'
      );
    }

    await subscription.destroy();
  }
}

export default new DeleteSubscriptionService();
