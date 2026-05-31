# 🍡 MariGourmet — Controle Financeiro

Site de controle financeiro para o negócio de geladinhos e bolos de pote da MariGourmet.

## ✅ Funcionalidades

- 📊 **Dashboard** com resumo dos últimos 30, 60 ou 90 dias
- 💰 Registro de **receitas** (vendas)
- 🛒 Registro de **gastos** (materiais)
- 📆 **Calendário** mostrando receita bruta por dia
- 📋 **Histórico** completo com filtros
- 📈 **Margem de lucro** automática
- 💡 **Dicas** de gestão para o negócio
- 💾 Dados salvos em **CSV** (leve e portátil)

---

## 🚀 Como publicar no Vercel (passo a passo)

### Pré-requisitos
- Conta no [GitHub](https://github.com) (grátis)
- Conta no [Vercel](https://vercel.com) (grátis)

### Passo 1 — Criar repositório no GitHub

1. Acesse github.com e faça login
2. Clique em **"New repository"** (botão verde)
3. Dê o nome: `marigourmet`
4. Deixe como **Public** (ou Private, tanto faz)
5. Clique em **"Create repository"**

### Passo 2 — Enviar os arquivos

No terminal (ou Git Bash), dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "MariGourmet - primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/marigourmet.git
git push -u origin main
```

### Passo 3 — Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `marigourmet`
4. Clique em **"Deploy"**
5. Aguarde (leva ~2 minutos)
6. ✅ Pronto! Você terá um link tipo: `https://marigourmet.vercel.app`

### Passo 4 — Compartilhar com sua sócia

Basta enviar o link gerado pelo Vercel! Qualquer pessoa com o link pode acessar e lançar dados.

---

## ⚠️ Aviso importante sobre os dados

O CSV fica salvo **no servidor do Vercel**. Toda vez que você fizer um novo deploy (publicar atualização), os dados do CSV são **resetados**.

### Solução recomendada para dados permanentes:
- Use o [PlanetScale](https://planetscale.com) (banco MySQL grátis) ou
- [Neon](https://neon.tech) (banco PostgreSQL grátis) ou
- Exporte o CSV pelo histórico regularmente como backup

Para uso simples do dia a dia sem redeploys frequentes, o CSV funciona perfeitamente!

---

## 🛠️ Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000
