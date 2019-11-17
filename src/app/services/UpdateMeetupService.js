import { isBefore, parseISO } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';

import UpdateMeetupError from '../errors/StatusCodeErrors';

class UpdateMeetupService {
  async run({ meetup_id, user_idreq, body }) {
    const meetup = await Meetup.findByPk(meetup_id);

    if (!meetup) {
      throw new UpdateMeetupError(404, 'Meetup not found');
    }

    const { date_and_hour: date, user_id: user } = meetup;

    if (user !== user_idreq) {
      throw new UpdateMeetupError(
        401,
        `You can only edit if you are meetups's owner`
      );
    }

    if (isBefore(date, new Date())) {
      throw new UpdateMeetupError(
        400,
        'You cannot edit a meetup that has passed'
      );
    }

    const startDate = parseISO(body.date_and_hour);

    if (isBefore(startDate, new Date())) {
      throw new UpdateMeetupError(400, 'Past dates are not permitted');
    }

    const { banner_id: bannerCheck } = body;

    if (bannerCheck) {
      const fileExists = await File.findByPk(bannerCheck);

      if (!fileExists) {
        throw new UpdateMeetupError(400, 'Could not find specified image');
      }
    }

    await meetup.update(body, {
      fields: [
        'title',
        'description',
        'localization',
        'banner_id',
        'date_and_hour',
      ],
    });

    const meetupUpdated = await Meetup.findByPk(meetup_id, {
      include: [
        { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
      ],
    });

    return meetupUpdated;
  }
}

export default new UpdateMeetupService();
