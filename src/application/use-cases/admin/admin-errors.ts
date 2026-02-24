export class UserAlreadyAdminError extends Error {
  constructor() {
    super('Usuario ja eh admin');
    this.name = 'UserAlreadyAdminError';
  }
}

export class UserAlreadyBlockedError extends Error {
  constructor() {
    super('Usuario ja esta bloqueado');
    this.name = 'UserAlreadyBlockedError';
  }
}

export class UserNotBlockedError extends Error {
  constructor() {
    super('Usuario nao esta bloqueado');
    this.name = 'UserNotBlockedError';
  }
}

export class CannotBlockAdminError extends Error {
  constructor() {
    super('Nao eh possivel bloquear um admin');
    this.name = 'CannotBlockAdminError';
  }
}

export class CannotPromoteBlockedUserError extends Error {
  constructor() {
    super('Usuario esta bloqueado');
    this.name = 'CannotPromoteBlockedUserError';
  }
}

export class UserBlockedError extends Error {
  constructor() {
    super('Conta bloqueada. Entre em contato com o administrador.');
    this.name = 'UserBlockedError';
  }
}
