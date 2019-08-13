import * as Yup from 'yup';
import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const {
      id,
      title,
      description,
      localization,
      date_and_hour,
    } = await Meetup.create(req.body);

    return res.json({
      id,
      title,
      description,
      localization,
      date_and_hour,
    });
  }
}

export default new MeetupController();
