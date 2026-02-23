import { ConflictException } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleRepository } from '../application/ports/people-repository';
import { PasswordHasher } from '../application/ports/password-hasher';
import { EmailAlreadyExistsError } from '../application/use-cases/user-errors';

describe('PeopleService', () => {
  let service: PeopleService;
  let peopleRepository: jest.Mocked<PeopleRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    peopleRepository = {
      findAllFuncionarios: jest.fn(),
      findFuncionarioById: jest.fn(),
      createFuncionarioWithUser: jest.fn(),
      createFuncionario: jest.fn(),
      findAllCorretores: jest.fn(),
      findCorretorById: jest.fn(),
      createCorretor: jest.fn(),
    };

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    service = new PeopleService(peopleRepository, passwordHasher);
  });

  it('should create funcionario with user and return response', async () => {
    passwordHasher.hash.mockResolvedValue('hashed-password');

    peopleRepository.createFuncionarioWithUser.mockResolvedValue({
      id: 'func-1',
      userId: 'user-1',
      cpf: '123.456.789-00',
      telefone: '11999999999',
      status: 'ATIVO',
      dataCadastro: new Date('2024-01-01T00:00:00.000Z'),
      user: {
        id: 'user-1',
        nome: 'Maria Santos',
        email: 'maria.santos@imobix.com',
        passwordHash: 'hashed-password',
        role: 'USER',
        avatar: null,
        phone: null,
        userRole: 'funcionario',
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      }
    } as any);

    const result = await service.createFuncionario({
      nome: 'Maria Santos',
      email: 'maria.santos@imobix.com',
      password: 'password123',
      cpf: '123.456.789-00',
      telefone: '11999999999',
      status: 'ATIVO',
      endereco: 'Rua A, 100',
      departamento: 'TI'
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(peopleRepository.createFuncionarioWithUser).toHaveBeenCalledWith({
      nome: 'Maria Santos',
      email: 'maria.santos@imobix.com',
      passwordHash: 'hashed-password',
      cpf: '123.456.789-00',
      telefone: '11999999999',
      status: 'ATIVO'
    });
    expect(result).toMatchObject({
      success: true,
      message: 'Funcionário criado com sucesso',
      data: {
        id: 'func-1',
        nome: 'Maria Santos',
        email: 'maria.santos@imobix.com',
        cpf: '123.456.789-00',
        telefone: '11999999999',
        role: 'USER',
        status: 'ATIVO',
        endereco: 'Rua A, 100',
        departamento: 'TI'
      }
    });
  });

  it('should throw ConflictException when email already exists', async () => {
    passwordHasher.hash.mockResolvedValue('hashed-password');
    peopleRepository.createFuncionarioWithUser.mockRejectedValue(
      new EmailAlreadyExistsError('duplicate@imobix.com')
    );

    await expect(
      service.createFuncionario({
        nome: 'Maria Santos',
        email: 'duplicate@imobix.com',
        password: 'password123',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
