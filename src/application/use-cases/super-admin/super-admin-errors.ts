export class TenantNotFoundError extends Error {
  constructor() {
    super('Tenant não encontrado');
    this.name = 'TenantNotFoundError';
  }
}

export class TenantAlreadySuspendedError extends Error {
  constructor() {
    super('Tenant já está suspenso');
    this.name = 'TenantAlreadySuspendedError';
  }
}

export class TenantNotSuspendedError extends Error {
  constructor() {
    super('Tenant não está suspenso');
    this.name = 'TenantNotSuspendedError';
  }
}

export class TenantAlreadyRemovedError extends Error {
  constructor() {
    super('Tenant já foi removido');
    this.name = 'TenantAlreadyRemovedError';
  }
}

export class AdminEmailAlreadyExistsError extends Error {
  constructor() {
    super('Já existe um usuário com este e-mail');
    this.name = 'AdminEmailAlreadyExistsError';
  }
}
