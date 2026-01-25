export class LeadNotFoundError extends Error {
  constructor(id: string) {
    super(`Lead with id ${id} not found`);
    this.name = 'LeadNotFoundError';
  }
}

export class LeadAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Lead with email ${email} already exists`);
    this.name = 'LeadAlreadyExistsError';
  }
}

export class InvalidLeadOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLeadOperationError';
  }
}
