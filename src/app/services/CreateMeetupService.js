import { parseISO, isBefore } from 'date-fns';

import User from '../models/User';
import File from '../models/File';
import Meetup from '../models/Meetup';

import CreateMeetupError from '../errors/StatusCodeErrors';

class CreateMeetupService {
  async run({ user_id, date_and_hour, banner_id, body }) {
    const userExists = await User.findByPk(user_id);

    if (!userExists) {
      throw new CreateMeetupError(
        401,
        'You can only create a meetup if you are a valid user'
      );
    }

    if (banner_id) {
      const fileExists = await File.findByPk(banner_id);

      if (!fileExists) {
        throw new CreateMeetupError(400, 'Could not find specified image');
      }
    }

    const startDate = parseISO(date_and_hour);

    if (isBefore(startDate, new Date())) {
      throw new CreateMeetupError(400, 'Past dates are not permitted');
    }

    const meetup = await Meetup.create(body);

    return meetup;
  }
}

export default new CreateMeetupService();
