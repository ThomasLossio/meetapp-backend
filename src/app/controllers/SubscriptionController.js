import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import File from '../models/File';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

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
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user = await User.findByPk(req.userId);
    const { meetup_id } = req.body;

    const meetup = await Meetup.findByPk(meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You cannot subscribe for your own meetup' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: 'This meetup has passed' });
    }

    const checkSubscribed = await Subscription.findOne({
      where: { user_id: req.userId, meetup_id },
    });

    if (checkSubscribed) {
      return res.status(400).json({
        error: 'You cannot subscribe on a meetup you already has subscribed',
      });
    }

    const checkDate = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          where: { date_and_hour: meetup.date_and_hour },
        },
      ],
    });

    if (checkDate) {
      return res.status(400).json({
        error: 'You are already subscribed in another meetup at the same time',
      });
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }

  async delete(req, res) {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(400).json({
        error: 'This subscription does not exist',
      });
    }

    if (subscription.user_id !== req.userId) {
      return res.status(400).json({
        error: 'This subscripiton is not yours',
      });
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

    if (meetup.user.id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You cannot unsubscribe for your own meetup' });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'This meetup has passed, you cannot unsubscribe it anymore',
      });
    }

    await subscription.destroy();

    return res.status(204).json();
  }
}

export default new SubscriptionController();
