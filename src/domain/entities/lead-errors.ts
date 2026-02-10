export class LeadNotQualifiedError extends Error {
  constructor() {
    super('Lead must be qualified before conversion');
    this.name = 'LeadNotQualifiedError';
  }
}

export class LeadAlreadyConvertedError extends Error {
  constructor() {
    super('Lead is already converted');
    this.name = 'LeadAlreadyConvertedError';
  }
}
