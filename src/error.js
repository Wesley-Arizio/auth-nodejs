export class ServiceError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends ServiceError {
  constructor(msg) {
    super(msg);
    this.status = 400;
  }
}

export class InvalidCredentials extends ServiceError {
  constructor() {
    super("Invalid Credentials");
    this.status = 401;
  }
}
