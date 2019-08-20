import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return 'qualquer coisa';
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
