import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';

import Mail from '../../lib/mail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          attributes: ['id', 'title', 'date_and_hour', 'past'],
          where: { date_and_hour: { [Op.gt]: new Date() } },
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

    await Mail.sendMail({
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

    return res.json(subscription);
  }
}

export default new SubscriptionController();
