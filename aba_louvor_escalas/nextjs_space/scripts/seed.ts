import { PrismaClient, Rede, Nivel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed InstrumentoConfig
  const instrumentosSeed = [
    { codigo: 'BATERIA', nome: 'Bateria', ordem: 1 },
    { codigo: 'BAIXO', nome: 'Baixo', ordem: 2 },
    { codigo: 'GUITARRA', nome: 'Guitarra', ordem: 3 },
    { codigo: 'VIOLAO', nome: 'Violão', ordem: 4 },
    { codigo: 'TECLADO', nome: 'Teclado', ordem: 5 },
    { codigo: 'BACK_VOCAL', nome: 'Back Vocal', ordem: 6 },
    { codigo: 'TECNICO_SOM', nome: 'Técnico de Som', ordem: 7 },
    { codigo: 'TECNICO_TRANSMISSAO', nome: 'Técnico de Transmissão', ordem: 8 },
  ];
  for (const inst of instrumentosSeed) {
    await prisma.instrumentoConfig.upsert({
      where: { codigo: inst.codigo },
      update: {},
      create: inst,
    });
  }
  console.log('InstrumentoConfig seeded');

  // Create test user (required for testing)
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'Admin Teste'
    }
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('abalouvor2026', 10);
  await prisma.user.upsert({
    where: { email: 'admin@abalouvor.com' },
    update: {},
    create: {
      email: 'admin@abalouvor.com',
      password: adminPassword,
      name: 'Administrador'
    }
  });

  console.log('Users created');

  // Create cultos for April 2026
  const cultos = [
    {
      data: new Date('2026-04-05'),
      especial: false,
      redeResponsavel: Rede.BRANCA,
      descricao: null
    },
    {
      data: new Date('2026-04-12'),
      especial: true,
      redeResponsavel: Rede.AMARELA,
      descricao: 'Páscoa'
    },
    {
      data: new Date('2026-04-19'),
      especial: false,
      redeResponsavel: Rede.LARANJA,
      descricao: null
    },
    {
      data: new Date('2026-04-26'),
      especial: false,
      redeResponsavel: Rede.ROXA,
      descricao: null
    }
  ];

  for (const cultoData of cultos) {
    const existing = await prisma.culto.findFirst({
      where: { data: cultoData.data }
    });
    
    if (!existing) {
      await prisma.culto.create({
        data: cultoData
      });
    }
  }

  console.log('Cultos created');

  // Create voluntarios
  const voluntarios = [
    // Rede Branca
    {
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      dataNascimento: new Date('1995-03-15'),
      rede: Rede.BRANCA,
      qualGC: 'GC Centro',
      discipulador: 'Pastor Carlos',
      instrumentos: ['BATERIA'],
      ministro: false,
      diretorCulto: true,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Maria Santos',
      email: 'maria.santos@email.com',
      dataNascimento: new Date('1998-07-22'),
      rede: Rede.BRANCA,
      qualGC: 'GC Centro',
      discipulador: 'Pastor Carlos',
      instrumentos: ['BACK_VOCAL'],
      ministro: true,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Pedro Oliveira',
      email: 'pedro.oliveira@email.com',
      dataNascimento: new Date('2000-11-08'),
      rede: Rede.BRANCA,
      qualGC: 'GC Sul',
      discipulador: 'Líder Ana',
      instrumentos: ['GUITARRA'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    },
    // Rede Amarela
    {
      nome: 'Ana Costa',
      email: 'ana.costa@email.com',
      dataNascimento: new Date('1992-05-18'),
      rede: Rede.AMARELA,
      qualGC: 'GC Norte',
      discipulador: 'Pastora Julia',
      instrumentos: ['TECLADO'],
      ministro: false,
      diretorCulto: true,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Lucas Ferreira',
      email: 'lucas.ferreira@email.com',
      dataNascimento: new Date('1997-09-12'),
      rede: Rede.AMARELA,
      qualGC: 'GC Norte',
      discipulador: 'Pastora Julia',
      instrumentos: ['BAIXO'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Juliana Alves',
      email: 'juliana.alves@email.com',
      dataNascimento: new Date('1999-12-03'),
      rede: Rede.AMARELA,
      qualGC: 'GC Leste',
      discipulador: 'Líder Marcos',
      instrumentos: ['BACK_VOCAL'],
      ministro: true,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    },
    // Rede Laranja
    {
      nome: 'Carlos Mendes',
      email: 'carlos.mendes@email.com',
      dataNascimento: new Date('1994-02-25'),
      rede: Rede.LARANJA,
      qualGC: 'GC Oeste',
      discipulador: 'Pastor Roberto',
      instrumentos: ['VIOLAO'],
      ministro: false,
      diretorCulto: true,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Beatriz Lima',
      email: 'beatriz.lima@email.com',
      dataNascimento: new Date('2001-06-19'),
      rede: Rede.LARANJA,
      qualGC: 'GC Oeste',
      discipulador: 'Pastor Roberto',
      instrumentos: ['BACK_VOCAL'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    },
    {
      nome: 'Rafael Souza',
      email: 'rafael.souza@email.com',
      dataNascimento: new Date('1996-10-30'),
      rede: Rede.LARANJA,
      qualGC: 'GC Centro Sul',
      discipulador: 'Líder Paula',
      instrumentos: ['TECNICO_SOM'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    // Rede Roxa
    {
      nome: 'Fernanda Ribeiro',
      email: 'fernanda.ribeiro@email.com',
      dataNascimento: new Date('1993-08-14'),
      rede: Rede.ROXA,
      qualGC: 'GC Sudeste',
      discipulador: 'Pastora Maria',
      instrumentos: ['BATERIA'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Gabriel Martins',
      email: 'gabriel.martins@email.com',
      dataNascimento: new Date('1998-04-07'),
      rede: Rede.ROXA,
      qualGC: 'GC Sudeste',
      discipulador: 'Pastora Maria',
      instrumentos: ['BAIXO'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    },
    {
      nome: 'Camila Pereira',
      email: 'camila.pereira@email.com',
      dataNascimento: new Date('2000-01-21'),
      rede: Rede.ROXA,
      qualGC: 'GC Nordeste',
      discipulador: 'Líder João',
      instrumentos: ['BACK_VOCAL'],
      ministro: true,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    // Adicionais multi-instrumento
    {
      nome: 'Thiago Rocha',
      email: 'thiago.rocha@email.com',
      dataNascimento: new Date('1995-11-28'),
      rede: Rede.BRANCA,
      qualGC: 'GC Noroeste',
      discipulador: 'Pastor André',
      instrumentos: ['GUITARRA', 'VIOLAO'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.EXPERIENTE
    },
    {
      nome: 'Larissa Cardoso',
      email: 'larissa.cardoso@email.com',
      dataNascimento: new Date('1999-05-16'),
      rede: Rede.AMARELA,
      qualGC: 'GC Central',
      discipulador: 'Líder Fernanda',
      instrumentos: ['TECLADO', 'BACK_VOCAL'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    },
    {
      nome: 'Matheus Gomes',
      email: 'matheus.gomes@email.com',
      dataNascimento: new Date('2002-03-09'),
      rede: Rede.LARANJA,
      qualGC: 'GC Zona Sul',
      discipulador: 'Pastor Ricardo',
      instrumentos: ['TECNICO_TRANSMISSAO'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.NOVO
    },
    {
      nome: 'Isabela Nunes',
      email: 'isabela.nunes@email.com',
      dataNascimento: new Date('1997-12-11'),
      rede: Rede.ROXA,
      qualGC: 'GC Vila',
      discipulador: 'Líder Beatriz',
      instrumentos: ['BACK_VOCAL'],
      ministro: false,
      diretorCulto: false,
      nivel: Nivel.MEDIO
    }
  ];

  for (const voluntarioData of voluntarios) {
    await prisma.voluntario.upsert({
      where: { email: voluntarioData.email },
      update: {},
      create: {
        ...voluntarioData,
        ativo: true
      }
    });
  }

  console.log('Voluntarios created');

  // Create some ausencias
  const voluntarioAusente = await prisma.voluntario.findUnique({
    where: { email: 'pedro.oliveira@email.com' }
  });

  if (voluntarioAusente) {
    await prisma.ausencia.create({
      data: {
        voluntarioId: voluntarioAusente.id,
        dataInicio: new Date('2026-04-12'),
        dataFim: new Date('2026-04-19'),
        motivo: 'Viagem'
      }
    });
  }

  console.log('Ausencias created');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
