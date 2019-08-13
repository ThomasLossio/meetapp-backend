import Sequelize, { Model } from 'sequelize';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        localization: Sequelize.STRING,
        date_and_hour: Sequelize.DATE,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default Meetup;
