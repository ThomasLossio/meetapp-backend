import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import File from '../models/File';

import CreateSubscriptionService from '../services/CreateSubscriptionService';
import DeleteSubscriptionService from '../services/DeleteSubscriptionService';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          attributes: ['id', 'title', 'date_and_hour', 'localization', 'past'],
          where: { date_and_hour: { [Op.gt]: new Date() } },
          include: [
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      order: [[Meetup, 'date_and_hour']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const { meetup_id } = req.body;

    const subscription = await CreateSubscriptionService.run({
      user_id: req.userId,
      meetup_id,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    await DeleteSubscriptionService.run({
      subscription_id: req.params.id,
      user_id: req.userId,
    });

    return res.status(204).json();
  }
}

export default new SubscriptionController();
