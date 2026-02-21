import { Inject, Injectable } from '@nestjs/common';
import { PeopleRepository } from '../application/ports/people-repository';
import { PasswordHasher } from '../application/ports/password-hasher';
import { PASSWORD_HASHER } from '../users/users.tokens';
import { PEOPLE_REPOSITORY } from './people.tokens';

@Injectable()
export class PeopleService {
  constructor(
    @Inject(PEOPLE_REPOSITORY) private readonly peopleRepository: PeopleRepository,
    @Inject(PASSWORD_HASHER) private passwordHasher: PasswordHasher,
  ) {}

  // Funcionarios
  async findAllFuncionarios() {
    const funcionarios = await this.peopleRepository.findAllFuncionarios();

    return funcionarios.map(funcionario => ({
      id: funcionario.id,
      nome: funcionario.user.nome,
      email: funcionario.user.email,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      role: funcionario.user.role,
      status: funcionario.status,
      dataCadastro: funcionario.dataCadastro,
      endereco: null,
      departamento: null
    }));
  }

  async findFuncionario(id: string) {
    const funcionario = await this.peopleRepository.findFuncionarioById(id);

    if (!funcionario) {
      return null;
    }

    return {
      id: funcionario.id,
      nome: funcionario.user.nome,
      email: funcionario.user.email,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      role: funcionario.user.role,
      status: funcionario.status,
      dataCadastro: funcionario.dataCadastro,
      endereco: null,
      departamento: null
    };
  }

  async createFuncionario(data: { 
    nome: string; 
    email: string; 
    password: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
    endereco?: string;
    departamento?: string;
  }) {
    const passwordHash = await this.passwordHasher.hash(data.password);

    const funcionario = await this.peopleRepository.createFuncionario({
      userId: '',
      cpf: data.cpf,
      telefone: data.telefone,
      status: data.status || 'ATIVO',
    });

    return {
      data: {
        id: funcionario.id,
        nome: data.nome,
        email: data.email,
        cpf: data.cpf,
        telefone: data.telefone,
        role: 'USER',
        status: data.status || 'ATIVO',
        dataCadastro: new Date(),
        endereco: data.endereco || null,
        departamento: data.departamento || null
      },
      message: 'Funcionário criado com sucesso',
      success: true
    };
  }

  // Corretores
  async findAllCorretores() {
    return this.peopleRepository.findAllCorretores();
  }

  async findCorretor(id: string) {
    return this.peopleRepository.findCorretorById(id);
  }

  async createCorretor(data: any) {
    return this.peopleRepository.createCorretor(data);
  }
}
