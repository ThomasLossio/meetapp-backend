import { Op } from 'sequelize';
import { parseISO, isBefore, endOfDay, startOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

import CreateMeetupService from '../services/CreateMeetupService';
import UpdateMeetupService from '../services/UpdateMeetupService';

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
    const { user_id, date_and_hour, banner_id } = req.body;

    const meetup = await CreateMeetupService.run({
      user_id,
      date_and_hour,
      banner_id,
      body: req.body,
    });

    return res.json(meetup);
  }

  async update(req, res) {
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
    } = await UpdateMeetupService.run({
      meetup_id: req.params.id,
      user_idreq: req.userId,
      body: req.body,
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
