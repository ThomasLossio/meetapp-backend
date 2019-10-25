import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class OrganizingController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'title', 'date_and_hour', 'cancelable'],
      limit: 10,
      offset: (page - 1) * 10,
      order: [['date_and_hour', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(meetups);
  }

  async show(req, res) {
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
      attributes: [
        'id',
        'title',
        'date_and_hour',
        'cancelable',
        'localization',
        'description',
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
    });

    return res.json(meetup);
  }
}

export default new OrganizingController();
