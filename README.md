# 🎵 Aba Louvor - Sistema de Escalas

Sistema de gerenciamento de escalas para equipe de louvor, desenvolvido com Next.js, Prisma e PostgreSQL.

## 📋 Sobre o Projeto

O **Aba Louvor - Escalas** é um aplicativo web para organizar e gerar escalas automáticas de cultos para equipes de louvor. O sistema permite cadastrar voluntários, cultos, instrumentos e ausências, além de gerar escalas inteligentes com base em regras configuráveis.

---

## 🚀 Funcionalidades

### Voluntários 
- Cadastro completo (nome, e-mail, rede, GC, discipulador, nível)
 - Múltiplos instrumentos por voluntário
 - Classificação por nível: **Experiente** , **Médio** , **Novo** 
- Marcação de **Ministro** e **Diretor Musical** 
- Importação em massa via Excel

### Cultos 
- Cadastro de cultos com data, rede responsável e descrição
 - Cultos especiais
 - Importação em massa via Excel

### Instrumentos 
- Configuração dinâmica de instrumentos (código, nome, ordem)
 - Ativar/desativar instrumentos sem perder dados

### Ausências 
- Registro de períodos de ausência por voluntário
 - Importação em massa via Excel

### Geração de Escalas 
-  **Algoritmo inteligente** com as seguintes regras:
   - ✅ Máximo de **3 escalas/mês** por voluntário (relaxamento progressivo se necessário)
   - ✅ **Variação de funções** — voluntários multi-instrumentos não repetem o mesmo instrumento em cultos consecutivos
   - ✅ **Nível da banda por culto** configurável:
     - 🔴 **100% Experiente** — só voluntários experientes
     - 🟡 **Intermediária** — especialistas + médios
     - 🟢 **Equilibrada** (padrão) — todos os níveis com prioridade exp > méd > novo
   - ✅ **Mínimo 1 ministro** por culto (processados ​​primeiro)
   - ✅ Validação: alerta se culto fica com apenas voluntários nível "novo"
   - ✅ Respeita ausências cadastradas
   - ✅ Sem voluntários duplicados no mesmo culto
   - ✅ Intervalo mínimo de 7 dias entre escalas do mesmo voluntário
   - ✅ Preserva edições manuais em regenerações
 -  **Avisos visuais** após geração (ministro ausente, todos novos, etc.)
 - Edição manual pós-geração
 - Exportação para **Excel** e **PDF**

### Dashboard com Métricas 
- Cards resumo: total de voluntários, cultos, ausências ativas
 - Filtros por **mês** e **ano** 
- Distribuição por **Nível** e **Rede** (barras visuais)
 - Rankings:
   - 🏆 Mais serviram (top 10)
   - 📉 Menos serviram (top 10)
   - ⚠️ Nunca escalados
   - 🎸 Funções mais escaladas
 - Média de participações por voluntário
 - Próximos cultos agendados

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **Next.js 14** | Framework React (Roteador de Aplicativos) |
| **TypeScript** | Tipagem estática |
| **PrismaORM** | Acesso ao banco de dados |
| **PostgreSQL** | Banco de dados relacionais |
| **CSS do vento a favor** | Estilização |
| **Movimento do enquadrador** | Animações |
| **Reação Lúcida** | Ícones |
| **xlsx** | Leitura/escrita de planilhas Excel |
| **jsPDF + Tabela Automática** | Geração de PDF |
| **data-fns** | Manipulação de dados |
| **NextAuth.js** | Autenticação (estrutura presente) |

---

## 📁 Estrutura do Projeto

nextjs_space/
├── app/
│ ├── api/
│ │ ├── ausencias/ # CRUD + importação de ausências
│ │ ├── cultos/ # CRUD + importação de cultos
│ │ ├── dashboard/
│ │ │ └── metricas/ # API de métricas do dashboard
│ │ ├── escalas/
│ │ │ ├── config/ # Configuração de slots e nível da banda
│ │ │ ├── editar/ # Edição manual de escalas
│ │ │ └── gerar/ # Algoritmo de geração de escalas
│ │ ├── instrumentos/ # CRUD de instrumentos
│ │ └── voluntários/ # CRUD + importação de voluntários
│ ├── ausencias/ # Página de ausências
│ ├── cultos/ # Página de cultos
│ ├── dashboard/ # Dashboard com métricas
│ ├── escalas/ # Geração e visualização de escalas
│ ├── instrumentos/ # Gestão de instrumentos
│ └── voluntários/ # Gestão de voluntários
├── componentes/
│ ├── header.tsx#Navegação principal
│ └── ui/ # Componentes reutilizáveis
​​├── lib/
│ ├── prisma.ts # Singleton do Prisma Client
│ └── auth-options.ts # Configuração NextAuth
├── prisma/
│ └── schema.prisma # Schema do banco de dados
└── scripts/
└── seed.ts # Dados iniciais
 

---

## 📊 Modelos do Banco de Dados

| Modelo | Descrição |
|---|---|
| `Voluntario` | Dados dos voluntários (instrumentos, nível, rede, etc.) |
| `Culto` | Cultos agendados com data e rede responsável |
| `Ausencia` | Períodos de ausência dos voluntários |
| `Escala` | Escala mensal gerada |
| `EscalaVoluntario` | Relação voluntário ↔ culto ↔ função na escala |
| `ConfigCultoEscala` | Configuração de slots e nível da banda por culto |
| `InstrumentoConfig` | Configuração dinâmica dos instrumentos disponíveis |

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Yarn

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd aba_louvor_escalas/nextjs_space

# Instale as dependências
yarn install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL

# Execute as migrações do banco
yarn prisma db push

# Gere o Prisma Client
yarn prisma generate

# (Opcional) Popule com dados iniciais
yarn prisma db seed

# Inicie o servidor de desenvolvimento
yarn dev
Variáveis ​​de Ambiente
ambiente
Cópia
DATABASE_URL="postgresql://usuario:senha@localhost:5432/aba_louvor"
NEXTAUTH_SECRET="sua-chave-secreta"
📥 Importação de Dados via Excel
Voluntários
Coluna	Descrição
nome	Nome completo
e-mail	E-mail (único)
rede	BRANCA, AMARELA, LARANJA ou ROXA
instrumentos	Códigos separados por vírgula (ex: BATERIA,VIOLAO)
nível	EXPERIENTE, MEDIO ou NOVO
ministro	verdadeiro/falso
#Culto	Diretor Musical (verdadeiro/falso)
Cultos
Coluna	Descrição
dados	Data do mês (DD/MM/AAAA)
especial	verdadeiro/falso
rede	BRANCA, AMARELA, LARANJA ou ROXA
descrição	Descrição
Ausências
Coluna	Descrição
e-mail	E-mail do documento
dataInício	Data inicial (DD/MM/AAAA)
dataFim	Data filme (DD/MM/AAAA)
razão	Motivo
🎨 Redes (Cores)
Rede	Cor
Branca	⚪#d1d5db
Amarela	🟡#facc15
Laranja	🟠#fb923c
Roxa	🟣#a855f7
📄 Licença
Este projeto é de uso privado para a equipe de louvor da igreja.

Desenvolvido com ❤️ para a glória de Deus.
