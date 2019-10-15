import * as Yup from 'yup';
import { Op } from 'sequelize';
import { parseISO, isBefore, endOfDay, startOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const where = {};
    const { page = 1 } = req.query;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date_and_hour = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      attributes: [
        'id',
        'title',
        'past',
        'cancelable',
        'localization',
        'date_and_hour',
        'user_id',
        'banner_id',
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      date_and_hour: Yup.date().required(),
      localization: Yup.string().required(),
      user_id: Yup.number().required(),
      banner_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { user_id, date_and_hour, banner_id } = req.body;

    const userExists = await User.findByPk(user_id);

    if (!userExists) {
      return res.status(401).json({
        error: 'You can only create a meetup if you are a valid user',
      });
    }

    if (banner_id) {
      const fileExists = await File.findByPk(banner_id);

      if (!fileExists) {
        return res
          .status(400)
          .json({ error: 'Could not find specified image' });
      }
    }

    const startDate = parseISO(date_and_hour);

    if (isBefore(startDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create(req.body);

    return res.json({
      meetup,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      localization: Yup.string(),
      date_and_hour: Yup.date(),
      banner_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(404).json({ error: 'Meetup not found' });
    }

    const { date_and_hour: date, user_id: user } = meetup;

    if (user !== req.userId) {
      return res
        .status(401)
        .json({ error: `You can only edit if you are meetups's owner` });
    }

    if (isBefore(date, new Date())) {
      return res
        .status(400)
        .json({ error: 'You cannot edit a meetup that has passed' });
    }

    const startDate = parseISO(date);

    if (isBefore(startDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const { banner_id: bannerCheck } = req.body;

    if (bannerCheck) {
      const fileExists = await File.findByPk(bannerCheck);

      if (!fileExists) {
        return res
          .status(400)
          .json({ error: 'Could not find specified image' });
      }
    }

    await meetup.update(req.body, {
      fields: [
        'title',
        'description',
        'localization',
        'banner_id',
        'date_and_hour',
      ],
    });

    const {
      id,
      title,
      description,
      localization,
      date_and_hour,
      banner,
      user_id,
      past,
      cancelable,
    } = await Meetup.findByPk(req.params.id, {
      include: [
        { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
      ],
    });

    return res.json({
      id,
      title,
      description,
      localization,
      date_and_hour,
      banner,
      user_id,
      past,
      cancelable,
    });
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(204).json();
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'You do not have permission to cancel this meetup' });
    }

    if (isBefore(meetup.date_and_hour, new Date())) {
      return res.status(400).json({ error: 'You cannot cancel past meetups' });
    }

    await meetup.destroy();

    return res.status(204).json();
  }
}

export default new MeetupController();
