import Meetup from '../models/Meetup';
import User from '../models/User';

class OrganizingController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'title', 'date_and_hour', 'cancelable'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(meetups);
  }

  async show(req, res) {
    const meetup = await Meetup.findOne({
      where: { user_id: req.userId },
      attributes: [
        'id',
        'title',
        'date_and_hour',
        'cancelable',
        'localization',
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(meetup);
  }
}

export default new OrganizingController();
