class StatusCodeErrors extends Error {
  constructor(status, ...args) {
    super(...args);
    this.status = status;
  }
}

module.exports = StatusCodeErrors;
